// ==UserScript==
// @name           Dead Frontier - Market
// @version        1.0.0
// @description    Adds Drag and Drop Features to search items in the market and search services, Colors item names in market lists. Filters service results to show cheapest per level.
// @author         XeiDaMoKa [2373510]
// @source         https://github.com/XeiDaMoKa/Dead-Frontier
// @downloadURL    https://github.com/XeiDaMoKa/Dead-Frontier/raw/main/Dead%20Frontier%20-%20Market.user.js
// @updateURL      https://github.com/XeiDaMoKa/Dead-Frontier/raw/main/Dead%20Frontier%20-%20Market.user.js
// @supportURL     https://fairview.deadfrontier.com/onlinezombiemmo/index.php?action=pm;sa=send
// @supportURL     https://github.com/XeiDaMoKa/Dead-Frontier/issues
// @match          https://fairview.deadfrontier.com/*
// @icon           https://host.xeidamoka.com/DeadFrontier/Scripts/Market/img/Market-Logo.png
// @grant          GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Color prefixes for item names.
    const colorPrefixes = [
        'white', 'grey', 'black', 'brown', 'red', 'blue', 'green', 'yellow', 'cyan', 'orange', 'pink', 'purple',
        'desert camo',
        'forest camo',
        'urban camo'
    ];

    // Color map for highlighting.
    const colorMap = {
    'Grey': '#808080',
    'Brown': '#633200',
    'Purple': '#660099',
    'Orange': '#FF5500',
    'Pink': '#AA00AA',
    'Red': '#990000',
    'Green': '#009900',
    'Blue': '#000099',
    'Yellow': '#AAAA00',
    'Cyan': '#00AAAA',
    'Black': '#000000',
    'White': '#FFFFFF',
    'Desert Camo': '#B5A96E',
    'Forest Camo': '#228B22', // deep forest green
    'Urban Camo': '#4B4B4B' // dark concrete grey
    };

    const PENDING_SEARCH_KEY = 'df_pending_market_search';

    // Strips color prefixes from item names.
    function stripColorPrefixes(name) {
        const prefixPattern = colorPrefixes.join('|');
        const regex = new RegExp(`^(?:${prefixPattern})(?:\\s+(?:${prefixPattern}))*\\s+`, 'i');
        if (regex.test(name)) {
            const stripped = name.replace(regex, '').trim();
            return stripped;
        } else {
            return name.trim();
        }
    }

    // FIXED: More precise service detection - only items that actually need services
    function getServiceType(tooltipText) {
        if (!tooltipText) return null;
        const lowerText = tooltipText.toLowerCase();

        // Only match if explicitly mentions "repair by engineer"
        if (lowerText.includes('repair by engineer')) {
            return { catname: 'Engineer', displayName: 'Repair', cattype: 'service' };
        }
        // Only match if explicitly mentions "can be administered by doctor" or similar
        else if (lowerText.includes('administered by doctor') || lowerText.includes('by doctor')) {
            return { catname: 'Doctor', displayName: 'Medical', cattype: 'service' };
        }
        // Only match if explicitly mentions "can be cooked by chef" or "cooked by chef"
        else if (lowerText.includes('can be cooked by chef') || lowerText.includes('cooked by chef')) {
            return { catname: 'Chef', displayName: 'Cooking', cattype: 'service' };
        }
        return null;
    }

    // Simulates click on elements.
    function simulateClick(element) {
        if (!element) return;
        try {
            element.click();
        } catch (e) {
            // ignore
        }
    }

    // FIXED: Update category display text after selection
    function updateCategoryDisplay(categoryInfo = null) {
        const categoryChoice = document.getElementById('categoryChoice');
        const catSpan = document.getElementById('cat');
        if (!catSpan) return;

        if (categoryInfo) {
            // Service category
            catSpan.textContent = `Services - ${categoryInfo.displayName}`;
        } else if (categoryChoice) {
            // Check what's actually selected
            const catname = categoryChoice.getAttribute('data-catname');
            const cattype = categoryChoice.getAttribute('data-cattype');

            if (!catname || catname === '') {
                catSpan.textContent = 'Everything';
            } else if (cattype === 'service') {
                // Find the display name from the list
                const categoryList = document.getElementById('categoryList');
                const option = categoryList?.querySelector(`div[data-catname="${catname}"][data-cattype="${cattype}"]`);
                if (option) {
                    catSpan.textContent = option.textContent;
                }
            } else {
                // Regular category - find display name
                const categoryList = document.getElementById('categoryList');
                const option = categoryList?.querySelector(`div[data-catname="${catname}"]`);
                if (option) {
                    catSpan.textContent = option.textContent;
                }
            }
        }
    }

    // Performs market search for items. Direct category selection without unnecessary "Everything" reset.
    function performSearch(rawName, draggedItemDataType, categoryInfo = null) {
        const searchField = document.getElementById('searchField');
        const categoryChoice = document.getElementById('categoryChoice');
        const categoryList = document.getElementById('categoryList');
        const makeSearchButton = document.getElementById('makeSearch');
        if (!searchField || !categoryChoice || !categoryList || !makeSearchButton) {
            return;
        }
        searchField.focus();

        // FIXED: Ensure category list is open before selecting
        if (categoryList.style.display === 'none' || categoryList.style.display === '') {
            simulateClick(categoryChoice);
        }

        setTimeout(() => {
            // Set search value: empty for services, truncated name for items
            if (categoryInfo) {
                searchField.value = '';
            } else {
                let itemName = stripColorPrefixes(rawName);
                if (itemName.length > 20) {
                    itemName = itemName.substring(itemName.length - 20);
                }
                searchField.value = itemName;
            }

            // FIXED: Select category with proper clicking and verification
            let targetOption = null;
            if (categoryInfo) {
                targetOption = categoryList.querySelector(`div[data-catname="${categoryInfo.catname}"][data-cattype="${categoryInfo.cattype}"]`);
            } else {
                targetOption = categoryList.querySelector('div[data-catname=""]');
            }

            if (targetOption) {
                // Click the option to select it
                simulateClick(targetOption);

                // Wait for the selection to register, then search
                setTimeout(() => {
                    // Trigger events on search field
                    const inputEvent = new Event('input', { bubbles: true });
                    const changeEvent = new Event('change', { bubbles: true });
                    searchField.dispatchEvent(inputEvent);
                    searchField.dispatchEvent(changeEvent);

                    // Click search button
                    simulateClick(makeSearchButton);

                    // Update display after search is triggered
                    setTimeout(() => updateCategoryDisplay(categoryInfo), 100);
                }, 100);
            } else {
                // Fallback if option not found
                const inputEvent = new Event('input', { bubbles: true });
                const changeEvent = new Event('change', { bubbles: true });
                searchField.dispatchEvent(inputEvent);
                searchField.dispatchEvent(changeEvent);
                simulateClick(makeSearchButton);
                setTimeout(() => updateCategoryDisplay(categoryInfo), 100);
            }
        }, 200);
    }

    // Adds price values to message titles.
    if (window.location.href.includes('action=pm')) {
        function extractDollarValues(text) {
            const dollarRegex = /\$[\d,]+/g;
            const matches = text.match(dollarRegex);
            return matches || [];
        }
        function formatDollarValues(values) {
            if (values.length === 0) return '';
            const uniqueValues = [...new Set(values)];
            uniqueValues.sort((a, b) => {
                const aNum = parseInt(a.replace(/[$,]/g, ''));
                const bNum = parseInt(b.replace(/[$,]/g, ''));
                return bNum - aNum;
            });
            return uniqueValues.map(value => {
                const num = parseInt(value.replace(/[$,]/g, ''));
                return num.toLocaleString() + ' $';
            }).join(', ');
        }
        function addPriceValues() {
            const messageRows = document.querySelectorAll('tbody tr');
            messageRows.forEach(row => {
                if (row.querySelector('th')) return;
                const titleCell = row.querySelector('td:nth-child(2) .topictitle a');
                if (!titleCell) return;
                const href = titleCell.getAttribute('href');
                const msgIdMatch = href.match(/#msg(\d+)/);
                if (!msgIdMatch) return;
                const msgId = msgIdMatch[1];
                const messageContentAnchor = document.querySelector(`a[name="msg${msgId}"]`);
                if (!messageContentAnchor) return;
                const messageDiv = messageContentAnchor.closest('tr').querySelector('.personalmessage');
                if (!messageDiv) return;
                const messageText = messageDiv.textContent || messageDiv.innerText;
                const dollarValues = extractDollarValues(messageText);
                if (dollarValues.length > 0 && !titleCell.textContent.includes(' $')) {
                    const formattedValues = formatDollarValues(dollarValues);
                    const priceSpan = document.createElement('span');
                    priceSpan.style.color = '#009900';
                    priceSpan.style.fontWeight = 'bold';
                    priceSpan.textContent = ' ' + formattedValues;
                    titleCell.appendChild(priceSpan);
                }
            });
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addPriceValues);
        } else {
            addPriceValues();
        }
    }

    // Applies color highlighting to item names.
    function applyColorToItemName(itemNameDiv) {
        if (itemNameDiv.querySelector('span[data-df-colored="true"]')) {
            return;
        }
        const originalText = itemNameDiv.textContent;
        let processedHtml = originalText;
        const sortedPrefixes = [...colorPrefixes].sort((a, b) => b.length - a.length);
        let colorApplied = false;

        for (const colorName of sortedPrefixes) {
            const regex = new RegExp(`^(${colorName.replace(/\s/g, '\\s')})\\b`, 'i');
            const match = originalText.match(regex);

            if (match) {
                const matchedColorWord = match[1];
                const restOfName = originalText.substring(match[0].length);

                let bgColor = colorMap[matchedColorWord];

                if (!bgColor) {
                    const normalizedKey = matchedColorWord.split(' ').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                    bgColor = colorMap[normalizedKey];
                }

                bgColor = bgColor || 'transparent';

                const tempSpan = document.createElement('span');
                tempSpan.style.backgroundColor = bgColor;
                tempSpan.style.color = 'transparent';
                tempSpan.style.padding = '0 1px';
                tempSpan.style.letterSpacing = 'normal';
                tempSpan.style.borderRadius = '3px';
                tempSpan.style.fontWeight = 'bold';
                tempSpan.style.display = 'inline-block';
                tempSpan.textContent = matchedColorWord;
                tempSpan.dataset.dfColored = 'true';

                processedHtml = tempSpan.outerHTML + restOfName;
                colorApplied = true;
                break;
            }
        }
        if (colorApplied) {
            itemNameDiv.innerHTML = processedHtml;
        }
    }

    // Makes items draggable.
    function makeItemsDraggable() {
        document.querySelectorAll('.item').forEach(item => {
            if (!item.getAttribute('draggable')) {
                item.setAttribute('draggable', 'true');
            }
        });
    }

    // Filters service results to show cheapest per level.
    function filterServiceResults(observer = null) {
        const itemDisplay = document.getElementById('itemDisplay');
        if (!itemDisplay) {
            return;
        }
        const serviceItems = Array.from(itemDisplay.querySelectorAll('.serviceItem'));
        if (serviceItems.length === 0) {
            return;
        }
        if (serviceItems.length <= 6) {
            return;
        }
        const isEngineerService = serviceItems.some(item => item.querySelector('.EngineerIcon'));
        const isDoctorService = serviceItems.some(item => item.querySelector('.DoctorIcon'));
        const isChefService = serviceItems.some(item => item.querySelector('.ChefIcon'));
        if (!isEngineerService && !isDoctorService && !isChefService) {
            return;
        }

        const cheapestByLevel = new Map();
        serviceItems.forEach(item => {
            const levelElement = item.querySelector('.level');
            const priceElement = item.querySelector('.salePrice');
            if (levelElement && priceElement) {
                const level = parseInt(levelElement.textContent);
                const price = parseInt(priceElement.textContent.replace('$', '').replace(',', ''));
                if (!isNaN(level) && !isNaN(price)) {
                    if (!cheapestByLevel.has(level) || price < cheapestByLevel.get(level).price) {
                        cheapestByLevel.set(level, { element: item, price: price });
                    }
                }
            }
        });
        if (observer) {
            observer.disconnect();
        }
        itemDisplay.innerHTML = '';
        const sortedLevels = Array.from(cheapestByLevel.keys()).sort((a, b) => a - b);
        sortedLevels.forEach(level => {
            itemDisplay.appendChild(cheapestByLevel.get(level).element);
        });
        if (observer) {
            observer.observe(itemDisplay, { childList: true, subtree: true });
        }
    }
    let isInitialized = false;

    // Observes DOM changes to setup enhancements.
    function observeAndSetupEnhancements() {
        if (isInitialized) {
            return;
        }

        // FIXED: Setup drag handlers globally (works on all pages)
        let mouseDownItem = null;
        let isDragging = false;
        let dragStartPos = null;
        const itemTooltipNames = new Map();

        // Global tooltip capture
        document.addEventListener('mouseover', e => {
            const itemDiv = e.target.closest('.item');
            if (itemDiv && !itemTooltipNames.has(itemDiv.getAttribute('data-type'))) {
                const dataType = itemDiv.getAttribute('data-type');
                setTimeout(() => {
                    const infoBox = document.getElementById('infoBox');
                    if (infoBox?.style.visibility === 'visible') {
                        const nameEl = infoBox.querySelector('.itemName');
                        const fullText = infoBox.textContent.trim();
                        if (nameEl && nameEl.textContent.trim()) {
                            itemTooltipNames.set(dataType, {
                                name: nameEl.textContent.trim(),
                                text: fullText
                            });
                        }
                    }
                }, 100);
            }
        }, true);

        // Global mousedown handler
        document.addEventListener('mousedown', e => {
            const itemDiv = e.target.closest('.item');
            if (itemDiv) {
                const dataType = itemDiv.getAttribute('data-type');
                const tooltipData = itemTooltipNames.get(dataType) || {
                    name: itemDiv.getAttribute('data-name') || '',
                    text: ''
                };
                mouseDownItem = {
                    type: dataType,
                    tooltipData: tooltipData
                };
                dragStartPos = { x: e.clientX, y: e.clientY };
                isDragging = false;

                const catSpan = document.getElementById('cat');
                if (catSpan) {
                    const serviceInfo = getServiceType(tooltipData.text);
                    if (serviceInfo) {
                        catSpan.textContent = `Drop here for ${serviceInfo.displayName}`;
                    } else {
                        catSpan.textContent = 'Drop here to search';
                    }
                }
            }
        });

        // Global mousemove handler
        document.addEventListener('mousemove', e => {
            if (mouseDownItem && dragStartPos) {
                const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
                if (dist > 5 && !isDragging) {
                    isDragging = true;
                }
                if (isDragging) {
                    const under = document.elementFromPoint(e.clientX, e.clientY);
                    const searchAreaEl = document.getElementById('searchArea');
                    const catSpan = document.getElementById('cat');
                    const isServiceItem = getServiceType(mouseDownItem.tooltipData.text);
                    const overSearchArea = searchAreaEl && (under === searchAreaEl || searchAreaEl.contains(under));

                    if (overSearchArea) {
                        if (isServiceItem && catSpan.textContent !== `Drop here for ${isServiceItem.displayName}`) {
                            catSpan.textContent = `Drop here for ${isServiceItem.displayName}`;
                        } else if (!isServiceItem && catSpan.textContent !== 'Drop here to search') {
                            catSpan.textContent = 'Drop here to search';
                        }
                    }
                }
            }
        });

        // Global mouseup handler
        document.addEventListener('mouseup', e => {
            let shouldReset = true;
            if (mouseDownItem && isDragging) {
                const under = document.elementFromPoint(e.clientX, e.clientY);
                const marketIcon = under.closest('a[title="Marketplace"]');

                // FIXED: Market icon drop works from any page
                if (marketIcon && mouseDownItem.tooltipData.name) {
                    const categoryInfo = getServiceType(mouseDownItem.tooltipData.text);
                    // Store search data for when market page loads
                    localStorage.setItem(PENDING_SEARCH_KEY, JSON.stringify({
                        name: mouseDownItem.tooltipData.name,
                        type: mouseDownItem.type,
                        category: categoryInfo // Will be null for regular items, service info for service items
                    }));

                    // Check if we're already on the market page
                    const isOnMarketPage = document.getElementById('searchField') &&
                                           document.getElementById('categoryChoice') &&
                                           document.getElementById('makeSearch');

                    if (isOnMarketPage) {
                        // Already on market page, perform search immediately
                        setTimeout(() => {
                            const data = JSON.parse(localStorage.getItem(PENDING_SEARCH_KEY));
                            if (data) {
                                localStorage.removeItem(PENDING_SEARCH_KEY);
                                performSearch(data.name, data.type, data.category);
                            }
                        }, 50);
                    } else {
                        // Not on market page, click icon to navigate
                        simulateClick(marketIcon);
                    }
                    shouldReset = false;
                } else {
                    const searchAreaEl = document.getElementById('searchArea');
                    const itemDisplayEl = document.getElementById('itemDisplay');
                    const onSearchAreaDrop = searchAreaEl && (under === searchAreaEl || searchAreaEl.contains(under));
                    const onItemDisplayDrop = itemDisplayEl && (under === itemDisplayEl || itemDisplayEl.contains(under));
                    const tooltipData = mouseDownItem.tooltipData;
                    const itemDataType = mouseDownItem.type;
                    if ((onSearchAreaDrop || onItemDisplayDrop) && tooltipData.name) {
                        const categoryInfo = getServiceType(tooltipData.text);
                        const effectiveCategory = (onSearchAreaDrop && categoryInfo) ? categoryInfo : null;
                        setTimeout(() => performSearch(tooltipData.name, itemDataType, effectiveCategory), 50);
                        shouldReset = false;
                    }
                }
            }
            // FIXED: Reset hint properly, but preserve manual selection
            if (shouldReset) {
                updateCategoryDisplay();
            }
            mouseDownItem = null;
            isDragging = false;
            dragStartPos = null;
        });

        // Make all existing items draggable on page load
        makeItemsDraggable();

        // Observe inventory on all pages to make new items draggable
        const globalInventoryObserver = new MutationObserver(() => {
            makeItemsDraggable();
        });

        const checkForInventory = setInterval(() => {
            const inventory = document.getElementById('inventory');
            if (inventory) {
                globalInventoryObserver.observe(inventory, { childList: true, subtree: true, attributes: true });
                clearInterval(checkForInventory);
            }
        }, 500);

        const observer = new MutationObserver((mutations, obs) => {
            const itemDisplay = document.getElementById('itemDisplay');
            const searchField = document.getElementById('searchField');
            const inventory = document.getElementById('inventory');
            const categoryChoice = document.getElementById('categoryChoice');
            const categoryList = document.getElementById('categoryList');
            const makeSearchButton = document.getElementById('makeSearch');
            if (itemDisplay && searchField && inventory && categoryChoice && categoryList && makeSearchButton) {
                obs.disconnect();
                isInitialized = true;

                // FIXED: Check for pending search and execute it with longer delay for page load
                const pendingSearch = localStorage.getItem(PENDING_SEARCH_KEY);
                if (pendingSearch) {
                    localStorage.removeItem(PENDING_SEARCH_KEY);
                    const data = JSON.parse(pendingSearch);
                    // Wait longer for page to fully load and stabilize before searching
                    setTimeout(() => performSearch(data.name, data.type, data.category), 800);
                }

                // FIXED: Add listener for manual category selection
                categoryList.addEventListener('click', (e) => {
                    const option = e.target.closest('div[data-catname]');
                    if (option) {
                        // Update display after manual selection
                        setTimeout(() => updateCategoryDisplay(), 50);
                    }
                });

                document.querySelectorAll('.fakeItem .itemName').forEach(applyColorToItemName);
                makeItemsDraggable();
                const itemDisplayObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1) {
                                    let itemNameDivs = [];
                                    if (node.classList.contains('itemName') && node.closest('.fakeItem')) {
                                        itemNameDivs.push(node);
                                    }
                                    node.querySelectorAll?.('.fakeItem .itemName').forEach(el => itemNameDivs.push(el));
                                    [...new Set(itemNameDivs)].forEach(applyColorToItemName);
                                    makeItemsDraggable();
                                    if (node.classList.contains('serviceItem') || node.querySelector('.serviceItem')) {
                                        clearTimeout(itemDisplayObserver.filterTimeout);
                                        itemDisplayObserver.filterTimeout = setTimeout(() => {
                                            filterServiceResults(itemDisplayObserver);
                                        }, 200);
                                    }
                                }
                            });
                        }
                    });
                });
                itemDisplayObserver.observe(itemDisplay, { childList: true, subtree: true });
                const inventoryObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        if (mutation.type === 'childList' || (mutation.type === 'attributes' && mutation.target.classList.contains('item'))) {
                            makeItemsDraggable();
                        }
                    });
                });
                inventoryObserver.observe(inventory, { childList: true, subtree: true, attributes: true });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeAndSetupEnhancements);
    } else {
        observeAndSetupEnhancements();
    }
})();