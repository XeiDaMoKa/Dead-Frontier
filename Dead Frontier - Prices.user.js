// ==UserScript==
// @name         Dead Frontier - Prices
// @version      1.0.0
// @description  Displays market value in items tooltips with price comparison. Handles color prefixes in item names for accurate price searching. Saves collection book items to storage on tab switch and displays collected quantity in tooltips (aggregating across colors for base item). Also works in collection book tooltips and market search results.
// @author       You
// @icon            https://www.google.com/s2/favicons?sz=64&domain=deadfrontier.com
// @match        https://fairview.deadfrontier.com/*
// ==/UserScript==

(function() {
    'use strict';
    const infoBox = document.getElementById('infoBox');
    if (infoBox) infoBox.style.pointerEvents = 'none';
    const colors = [
        'white', 'grey', 'black', 'brown', 'red', 'blue', 'green', 'yellow', 'cyan', 'orange', 'pink', 'purple',
        'desert camo',
        'forest camo',
        'urban camo'
    ];
    const marketCache = new Map();
    const searchedItems = new Set();
    const CACHE_DURATION = 60000;

    // Capitalizes words in a string, returns 'No Color' for empty strings.
    function capitalizeWords(str) {
        if (!str) return 'No Color';
        return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Processes item name to extract base name and detected color prefix.
    function processItemName(fullItemName) {
        let baseName = fullItemName.trim();
        let detectedColor = null;
        const sortedColors = [...colors].sort((a, b) => b.length - a.length);
        for (const color of sortedColors) {
            if (baseName.toLowerCase().startsWith(color.toLowerCase() + ' ')) {
                detectedColor = capitalizeWords(color);
                baseName = baseName.substring(color.length).trim();
                break;
            }
        }
        return { baseName, color: detectedColor };
    }

    // Retrieves a cookie value by name from document cookies.
    function getCookie(name) {
        const v = `; ${document.cookie}`;
        const parts = v.split(`; ${name}=`);
        return parts.length === 2 ? parts.pop().split(';')[0] : '';
    }

    // Extracts scrap price from the info box element.
    function extractScrapPrice(infoBox) {
        const scrapElement = Array.from(infoBox.querySelectorAll('.itemData')).find(
            el => el.textContent.includes('Scrap Price:')
        );
        if (scrapElement) {
            const match = scrapElement.textContent.match(/Scrap Price: \$([0-9,]+)/);
            if (match) return parseInt(match[1].replace(/,/g, ''));
        }
        return null;
    }

    // Fetches market listings for a specific item name and color from the API.
    async function fetchMarketListings(searchItemName, targetColor) {
        const normalizedSearchItemName = searchItemName.toLowerCase();
        const sessionKey = `${normalizedSearchItemName}-${targetColor ? targetColor.toLowerCase().replace(/\s/g, '') : 'nocolor'}`;

        if (searchedItems.has(sessionKey)) {

        }

        const cacheKey = sessionKey;
        const cached = marketCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        searchedItems.add(sessionKey);

        let apiSearchName = searchItemName;
        if (searchItemName.length > 20) {
            apiSearchName = searchItemName.slice(-20);
        }

        const rawHash = getCookie('DeadFrontierFairview') || '';
        const hash = decodeURIComponent(rawHash);
        const pagetime = Math.floor(Date.now() / 1000);
        const payload = {
            hash: hash,
            pagetime: pagetime,
            tradezone: 21,
            search: 'trades',
            searchtype: 'buyinglistitemname',
            searchname: apiSearchName
        };

        try {
            const res = await fetch('https://fairview.deadfrontier.com/onlinezombiemmo/trade_search.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': location.href,
                    'Origin': location.origin
                },
                body: Object.entries(payload)
                    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                    .join('&')
            });
            const text = await res.text();
            const listingsMap = new Map();
            const params = text.split('&').filter(p => p.startsWith('tradelist_'));

            params.forEach(param => {
                const parts = param.split('=');
                if (parts.length < 2) return;
                const key = parts[0];
                const value = parts.slice(1).join('=');
                const match = key.match(/tradelist_(\d+)_(.*)/);
                if (!match) return;
                const index = match[1];
                const field = match[2];
                if (!listingsMap.has(index)) {
                    listingsMap.set(index, {});
                }
                listingsMap.get(index)[field] = decodeURIComponent(value);
            });

            const listings = [];
            const targetBaseNameLower = searchItemName.toLowerCase();
            const normalizedTargetColor = targetColor ? targetColor.toLowerCase().replace(/\s/g, '') : 'no color';

            listingsMap.forEach(listingData => {
                const price = Number(listingData.price);
                const quantity = Number(listingData.quantity);
                const itemCode = listingData.item || '';
                const itemName = listingData.itemname || '';
                const itemTypeFromApi = listingData.type || '';
                const isAmmo = itemTypeFromApi.toLowerCase() === 'ammo' || itemCode.includes('ammo') || itemName.toLowerCase().includes('ammo');
                let effectivePrice;

                if (isAmmo && !isNaN(quantity) && quantity > 0) {
                    effectivePrice = price / quantity;
                } else {
                    effectivePrice = price;
                }

                let detectedListingColor = null;
                const colorCodeMatch = itemCode.match(/_colour([A-Za-z]+(?:[A-Za-z\s]*[A-Za-z])?)(_name.*)?$/i);
                if (colorCodeMatch) {
                    const matchedColor = colorCodeMatch[1].toLowerCase();
                    const foundColor = colors.find(c => c.toLowerCase().replace(/\s/g, '') === matchedColor.replace(/\s/g, ''));
                    if (foundColor) detectedListingColor = capitalizeWords(foundColor);
                }
                if (detectedListingColor === null && listingData.colour && listingData.colour !== '-') {
                    const foundColor = colors.find(c => c.toLowerCase().replace(/\s/g, '') === listingData.colour.toLowerCase().replace(/\s/g, ''));
                    if (foundColor) detectedListingColor = capitalizeWords(foundColor);
                }
                if (detectedListingColor === null && itemName) {
                    const { color: processedNameColor } = processItemName(itemName);
                    if (processedNameColor) detectedListingColor = processedNameColor;
                }

                const listingBaseName = processItemName(itemName).baseName.toLowerCase();
                const normalizedListingColor = detectedListingColor ? detectedListingColor.toLowerCase().replace(/\s/g, '') : 'no color';

                if (!isNaN(price) && (isAmmo ? (!isNaN(quantity) && quantity > 0) : true) &&
                    listingBaseName === targetBaseNameLower &&
                    normalizedListingColor === normalizedTargetColor) {
                    listings.push({
                        itemCode: itemCode,
                        itemName: itemName,
                        price: price,
                        quantity: quantity,
                        unitPrice: effectivePrice,
                        color: detectedListingColor,
                        seller: listingData.member_name || 'N/A',
                        tradeId: listingData.trade_id || 'N/A',
                        isAmmo: isAmmo,
                        itemTypeFromApi: itemTypeFromApi
                    });
                } else {

                }
            });

            marketCache.set(cacheKey, {
                data: listings,
                timestamp: Date.now()
            });
            return listings;
        } catch (err) {
            return [];
        }
    }

    // Finds the cheapest listing by sorting listings by unit price.
    function findCheapestListing(listings) {
        if (listings.length === 0) return null;
        return listings.filter(l => l.unitPrice > 0).sort((a, b) => a.unitPrice - b.unitPrice)[0];
    }

    // Finds the best market value for a given quantity by considering partial sales
    function findBestMarketValue(listings, targetQuantity) {
        if (listings.length === 0) return null;

        // Filter out listings with zero or negative unit price
        const validListings = listings.filter(l => l.unitPrice > 0);

        // Sort by unit price ascending (cheapest first)
        const sortedListings = validListings.sort((a, b) => a.unitPrice - b.unitPrice);

        let remainingQuantity = targetQuantity;
        let totalValue = 0;

        for (const listing of sortedListings) {
            if (remainingQuantity <= 0) break;

            const quantityToBuy = Math.min(remainingQuantity, listing.quantity);
            totalValue += quantityToBuy * listing.unitPrice;
            remainingQuantity -= quantityToBuy;
        }

        // If we couldn't fulfill the full quantity, return null
        if (remainingQuantity > 0) return null;

        return {
            totalValue: totalValue,
            unitPrice: totalValue / targetQuantity,
            listingsUsed: sortedListings.slice(0, sortedListings.findIndex(l => l.quantity >= remainingQuantity) + 1 || sortedListings.length)
        };
    }

    // Formats a number with locale-specific separators.
    function formatNumber(num) {
        return num.toLocaleString();
    }

    // Aggregates collected quantity for a base item name across all colors.
    function getAggregatedCollectedQty(baseName, cbItems) {
        let collectedQty = 0;
        for (const [storedName, qty] of Object.entries(cbItems || {})) {
            const { baseName: storedBase } = processItemName(storedName);
            if (storedBase.toLowerCase() === baseName.toLowerCase()) {
                collectedQty += qty;
            }
        }
        return collectedQty;
    }

    // Updates the market value and collected quantity display in the item tooltip.
    function updateMarketValueDisplay(infoBox, cheapestListing, scrapPrice, hoveredItemIsAmmo, hoveredItemQuantity, collectedQty) {
        console.log('[Prices Debug] updateMarketValueDisplay called with:', {
            cheapestListing,
            scrapPrice,
            hoveredItemIsAmmo,
            hoveredItemQuantity,
            collectedQty
        });

        const existingCustomDisplays = infoBox.querySelectorAll('.market-value-display, .collected-display');
        existingCustomDisplays.forEach(el => el.remove());

        const collectedDiv = document.createElement('div');
        collectedDiv.className = 'collected-display itemData';
        collectedDiv.style.color = collectedQty >= 1 ? '#00FF00' : '#FF0000';
        collectedDiv.textContent = `Collected: ${collectedQty}`;

        const scrapElement = Array.from(infoBox.querySelectorAll('.itemData')).find(
            el => el.textContent.includes('Scrap Price:')
        );
        const quantityElement = Array.from(infoBox.querySelectorAll('.itemData'))
            .find(el => el.textContent.includes('Rounds') || el.textContent.includes('Quantity:'));

        if (scrapElement) {
            scrapElement.insertAdjacentElement('beforebegin', collectedDiv);
        } else if (quantityElement) {
            quantityElement.insertAdjacentElement('afterend', collectedDiv);
        } else {
            const itemNameElement = infoBox.querySelector('.itemName');
            if (itemNameElement) {
                itemNameElement.insertAdjacentElement('afterend', collectedDiv);
            }
        }

        if (!cheapestListing) {
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'market-value-display itemData';
            noDataDiv.style.color = '#888';
            noDataDiv.style.fontStyle = 'italic';
            noDataDiv.textContent = 'Market Price: No exact listings found';
            if (scrapElement) scrapElement.insertAdjacentElement('afterend', noDataDiv);
            return;
        }

        // For ammo, show unit price and total based on your quantity vs market quantity
        if (hoveredItemIsAmmo) {
            const unitPrice = cheapestListing.unitPrice;
            const yourTotalValue = unitPrice * hoveredItemQuantity;

            console.log('[Prices Debug] Ammo calculations:', {
                unitPrice,
                yourQuantity: hoveredItemQuantity,
                yourTotalValue,
                scrapPrice
            });

            // Market price display with total and unit price
            const marketPriceDiv = document.createElement('div');
            marketPriceDiv.className = 'market-value-display itemData';
            marketPriceDiv.style.color = '#417f91';
            const totalValue = unitPrice * hoveredItemQuantity;
            marketPriceDiv.textContent = `Market Price: $${formatNumber(Math.floor(totalValue))} ($${unitPrice.toFixed(2)})`;

            // Profit/loss calculation
            const profitLossDiv = document.createElement('div');
            profitLossDiv.className = 'market-value-display itemData';

            if (scrapPrice !== null) {
                const difference = totalValue - scrapPrice;
                console.log('[Prices Debug] Profit calculation:', { totalValue, scrapPrice, difference });
                let label = 'Scrap Profit/Loss: ';
                let sign = '';
                let color = '#FFFFFF';
                if (difference > 0) {
                    label = 'Scrap Loss: ';
                    sign = '-';
                    color = '#FF0000';
                } else if (difference < 0) {
                    label = 'Scrap Profit: ';
                    sign = '+';
                    color = '#00FF00';
                } else {
                    label = 'Scrap Profit/Loss: ';
                    sign = '';
                    color = '#FFFFFF';
                }
                profitLossDiv.style.color = color;
                profitLossDiv.textContent = `${label}${sign}$${formatNumber(Math.abs(Math.floor(difference)))}`;
            }

            if (scrapElement) {
                scrapElement.insertAdjacentElement('afterend', profitLossDiv);
                scrapElement.insertAdjacentElement('afterend', marketPriceDiv);
            }
        } else {
            // Non-ammo items
            const marketPriceDiv = document.createElement('div');
            marketPriceDiv.className = 'market-value-display itemData';
            marketPriceDiv.style.color = '#417f91';
            marketPriceDiv.textContent = `Market Price: $${formatNumber(cheapestListing.price)}`;

            const totalMarketPriceDiv = document.createElement('div');
            totalMarketPriceDiv.className = 'market-value-display itemData';

            if (scrapPrice !== null) {
                const difference = cheapestListing.price - scrapPrice;
                let label = 'Scrap Profit/Loss: ';
                let sign = '';
                let color = '#FFFFFF';
                if (difference > 0) {
                    label = 'Scrap Loss: ';
                    sign = '-';
                    color = '#FF0000';
                } else if (difference < 0) {
                    label = 'Scrap Profit: ';
                    sign = '+';
                    color = '#00FF00';
                } else {
                    label = 'Scrap Profit/Loss: ';
                    sign = '';
                    color = '#FFFFFF';
                }
                totalMarketPriceDiv.style.color = color;
                totalMarketPriceDiv.textContent = `${label}${sign}$${formatNumber(Math.abs(Math.floor(difference)))}`;
            } else {
                totalMarketPriceDiv.style.color = '#ADD8E6';
                totalMarketPriceDiv.textContent = `Total Market Value: $${formatNumber(cheapestListing.price)}`;
            }

            if (scrapElement) {
                scrapElement.insertAdjacentElement('afterend', totalMarketPriceDiv);
                scrapElement.insertAdjacentElement('afterend', marketPriceDiv);
            }
        }
    }

    // Attaches mouse enter listeners to items for displaying market prices in tooltips.
    function attachListeners() {
        document.querySelectorAll('.item:not([data-tooltip-logged]), #collectionbook .fakeItem:not([data-tooltip-logged]), #collectionbook .slot:not([data-tooltip-logged]), #itemDisplay .fakeItem:not([data-tooltip-logged])').forEach(el => {
            el.setAttribute('data-tooltip-logged', 'true');
            el.addEventListener('mouseenter', async e => {
                const hoveredItemInfo = {
                    quality: el.getAttribute('data-quality'),
                    type: el.getAttribute('data-type'),
                    itemType: el.getAttribute('data-itemtype'),
                    quantity: parseInt(el.getAttribute('data-quantity')) || 1,
                    backgroundImage: el.style.backgroundImage,
                    slot: el.closest('.validSlot')?.getAttribute('data-slot') || 'N/A'
                };

                setTimeout(async () => {
                    if (infoBox && infoBox.style.visibility === 'visible') {
                        const fullItemName = infoBox.querySelector('.itemName')?.textContent || 'N/A';
                        const cbItems = JSON.parse(localStorage.getItem('cbItems') || '{}');
                        const { baseName } = processItemName(fullItemName);
                        const collectedQty = getAggregatedCollectedQty(baseName, cbItems);
                        const tooltipInfo = {
                            itemName: fullItemName,
                            cbBind: infoBox.querySelector('.cbind')?.textContent || 'N/A',
                            itemData: Array.from(infoBox.querySelectorAll('.itemData')).map(div => div.textContent.trim()),
                            opElements: Array.from(infoBox.querySelectorAll('.opElem')).map(div => div.textContent.trim()),
                        };

                        const isCollectionBook = !!infoBox.querySelector('.cbind');
                        const isMarketSearch = el.closest('#itemDisplay') !== null;
                        let hoveredItemQuantity = hoveredItemInfo.quantity || 1;
                        let hoveredItemIsAmmo = hoveredItemInfo.itemType === 'ammo';

                        // Additional check for ammo based on item name
                        if (fullItemName.toLowerCase().includes('ammo') || fullItemName.toLowerCase().includes('bullet')) {
                            hoveredItemIsAmmo = true;
                        }

                        // For collection book and market search, treat as single items
                        if (isCollectionBook || isMarketSearch) {
                            hoveredItemQuantity = 1;
                            if (!(isCollectionBook && hoveredItemIsAmmo)) {
                                hoveredItemIsAmmo = false;
                            }
                        }

                        // For ammo items, parse the actual quantity from the tooltip
                        let actualQuantity = hoveredItemQuantity;
                        if (hoveredItemIsAmmo && !isMarketSearch) {
                            const quantityText = tooltipInfo.itemData.find(d => d.includes('Rounds') || d.includes('Quantity:'));
                            if (quantityText) {
                                const match = quantityText.match(/(\d+)/);
                                if (match) actualQuantity = parseInt(match[1]);
                            }
                        }

                        const { baseName: tooltipBaseName, color: tooltipColor } = processItemName(fullItemName);

                        const scrapPrice = extractScrapPrice(infoBox);

                        const allListings = await fetchMarketListings(tooltipBaseName, tooltipColor);

                        // Debug logging for troubleshooting
                        console.log(`[Prices Debug] Item: ${fullItemName}, Base: ${tooltipBaseName}, Color: ${tooltipColor}, IsAmmo: ${hoveredItemIsAmmo}, Qty: ${actualQuantity}, Listings found: ${allListings.length}`);
                        if (allListings.length > 0) {
                            console.log('[Prices Debug] Listings:', allListings);
                            const cheapest = findCheapestListing(allListings);
                            console.log('[Prices Debug] Cheapest listing:', cheapest);
                            console.log('[Prices Debug] Will calculate total value as:', cheapest.unitPrice, '*', actualQuantity, '=', cheapest.unitPrice * actualQuantity);
                        }

                        if (allListings.length > 0) {
                            const cheapestListing = findCheapestListing(allListings);
                            if (cheapestListing) {
                                console.log('[Prices Debug] Using cheapest listing:', cheapestListing.price, 'unit:', cheapestListing.unitPrice, 'for item');
                            }
                            updateMarketValueDisplay(infoBox, cheapestListing, scrapPrice, hoveredItemIsAmmo, actualQuantity, collectedQty);
                        } else {
                            updateMarketValueDisplay(infoBox, null, scrapPrice, hoveredItemIsAmmo, actualQuantity, collectedQty);
                        }
                    } else {

                    }
                }, 100);
            });
            el.addEventListener('mouseleave', () => {
            });
        });
    }

    // Attaches listener to collection book tab switcher to save collected items to storage.
    function attachCollectionBookListener() {
        const cbSwitcher = document.getElementById('cbSwitcher');
        if (!cbSwitcher) return;

        cbSwitcher.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const tabName = e.target.textContent.trim();

                setTimeout(() => {
                    const collectionBook = document.getElementById('collectionbook');
                    if (collectionBook) {
                        const items = [];
                        collectionBook.querySelectorAll('.fakeItem').forEach(itemEl => {
                            const nameEl = itemEl.querySelector('div');
                            const name = nameEl ? nameEl.textContent.trim() : 'Unknown';
                            const quantity = parseInt(itemEl.getAttribute('data-quantity')) || 0;
                            items.push({ name, quantity });
                        });

                        let cbItems = JSON.parse(localStorage.getItem('cbItems') || '{}');
                        items.forEach(({name, quantity}) => {
                            cbItems[name] = quantity;
                        });
                        localStorage.setItem('cbItems', JSON.stringify(cbItems));

                    } else {

                    }
                }, 100);
            }
        });
    }

    const observer = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                attachListeners();
                attachCollectionBookListener();
                break;
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    attachListeners();
    attachCollectionBookListener();
})();
