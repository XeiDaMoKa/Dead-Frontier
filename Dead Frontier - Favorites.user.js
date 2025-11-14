// ==UserScript==
// @name                    Dead Frontier - Favorites
// @version                 1.0.0
// @description          Enhancments for Layout Script, adds Deposit and Withdraw buttons to Favorited bank icon, adds quick buy bullets and compares medical and food items prices and their effects.
// @author                  XeiDaMoKa [2373510]
// @source                  https://github.com/XeiDaMoKa/Dead-Frontier
// @downloadURL     https://github.com/XeiDaMoKa/Dead-Frontier/raw/main/Dead%20Frontier%20-%20Favorites.user.js
// @updateURL         https://github.com/XeiDaMoKa/Dead-Frontier/raw/main/Dead%20Frontier%20-%20Favorites.user.js
// @supportURL        https://fairview.deadfrontier.com/onlinezombiemmo/index.php?action=pm;sa=send
// @supportURL        https://github.com/XeiDaMoKa/Dead-Frontier/issues
// @match                  https://fairview.deadfrontier.com/*
// @icon                     https://www.google.com/s2/favicons?sz=64&domain=deadfrontier.com
// @grant                  GM_xmlhttpRequest
// @grant                  GM_getValue
// @grant                  GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const AMOUNTS = ['1,000', '10,000', '100,000', '1,000,000', '10,000,000', '100,000,000', '1,000,000,000'];

    const MEDICAL_ITEMS = [
        { name: 'Antibiotics', healingValue: 30 },
        { name: 'Antiseptic Spray', healingValue: 30 },
        { name: 'Bandages', healingValue: 36 },
        { name: 'Nerotonin-2', healingValue: 60 },
        { name: 'Nerotonin 8B', healingValue: 75 },
        { name: 'Nerotonin 5A', healingValue: 100 },
        { name: 'Hemostatic Gauze', healingValue: 45 },
        { name: 'Steroids', healingValue: 66 },
        { name: 'Mini First Aid Kit', healingValue: 150 },
    ];

    const BULLET_ITEMS = [
        { name: 'Gasoline' },
        { name: 'Energy Cell' },
        { name: 'Biomass' },
    ];

    const FOOD_ITEMS = [
        { name: 'Caviar', hungerValue: 48 },
        { name: 'Dried Truffles', hungerValue: 60 },
        { name: 'Eggs', hungerValue: 45 },
        { name: 'Fresh Vegetables', hungerValue: 60 },
        { name: 'Fresh Milk', hungerValue: 25 },
        { name: 'Mixed Nuts', hungerValue: 48 },
        { name: 'Potatoes', hungerValue: 36 },
        { name: 'Tinned Salmon', hungerValue: 36 },
        { name: 'Seeds', hungerValue: 30 },
    ];

    const origin = window.location.origin;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const currentPage = params.get('page') || '';
    const returnPage = params.get('originPage');
    const infoBox = document.createElement('div');
    infoBox.style.display = 'none';
    document.body.appendChild(infoBox);
    const colors = [
        'white', 'grey', 'black', 'brown', 'red', 'blue', 'green', 'yellow',
        'cyan', 'orange', 'pink', 'purple'
    ];
    const marketCache = new Map();
    const CACHE_DURATION = 60000;
    const QUICKBUY_PENDING_STORAGE_KEY = 'quickBuy_pending_hover';

    // Generates bullet image filename from item name.
    function getBulletImageFilename(name) {
        let clean = name.toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
        if (clean.endsWith('bullets')) {
            clean = clean.slice(0, -7);
        } else if (clean.endsWith('shells')) {
            clean = clean.slice(0, -6);
        }
        if (clean === 'grenades') {
            clean = 'grenade';
        } else if (clean === 'heavygrenades') {
            clean = 'heavygrenade';
        }
        if (clean.includes('mm')) {
            clean = clean.replace('mm', '');
        }
        clean = clean.replace('handgun', '');
        if (clean === '9') {
            clean = '35';
        }
        if (clean === 'gasoline') {
            clean = 'fuel';
        }
        return clean + 'ammo';
    }

    // Simulates a real click on an element.
    function realClick(el) {
        if (el) {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        } else {

        }
    }

    // Waits for a 'Yes' button to appear and clicks it.
    function waitForYesClick(cb) {
        const start = Date.now();
        (function poll() {
            const yes = Array.from(document.querySelectorAll('button'))
                .find(b => b.innerText.trim().toLowerCase() === 'yes');
            if (yes) {
                realClick(yes);
                cb && cb();
            } else if (Date.now() - start < 5000) {
                setTimeout(poll, 100);
            } else {

            }
        })();
    }

    // Purchases multiple items from the market.
    function purchaseMultiple(term, qty, count) {
        const findAndClickItem = () => {
            const items = Array.from(document.querySelectorAll('div.fakeItem'))
                .filter(d =>
                    d.querySelector('.itemName')?.textContent.trim() === term &&
                    Number(d.getAttribute('data-quantity')) === qty
                );
            if (items.length > 0) {
                const buyBtn = items[0].querySelector('button[data-action="buyItem"]');
                if (buyBtn) {
                    let i = 0;
                    (function loop() {
                        if (i >= count) {
                            return;
                        }
                        realClick(buyBtn);
                        waitForYesClick(() => {
                            i++;
                            setTimeout(loop, 300);
                        });
                    })();
                } else {
                }
                return true;
            }
            return false;
        };
        if (findAndClickItem()) {
            return;
        }
        const obs = new MutationObserver((mutationsList, observer) => {
            if (findAndClickItem()) {
                observer.disconnect();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            if (obs) {
                obs.disconnect();
            }
            if (!findAndClickItem() && window.location.search.includes('page=35')) {
            }
        }, 5000);
    }

    // Initiates quick buy by navigating to market page.
    function quickBuy(term, qty, count) {
        sessionStorage.setItem(QUICKBUY_PENDING_STORAGE_KEY,
            JSON.stringify({ term, qty, count }));
        window.location.href = `${origin}${path}?page=35`;
    }

    // Processes item name to extract base name and color.
    function processItemName(fullItemName) {
        let baseName = fullItemName.trim();
        let detectedColor = null;
        for (const color of colors) {
            if (baseName.toLowerCase().startsWith(color + ' ')) {
                detectedColor = color.charAt(0).toUpperCase() + color.slice(1);
                baseName = baseName.substring(color.length).trim();
                break;
            }
        }
        return { baseName, color: detectedColor };
    }

    // Retrieves a cookie value by name.
    function getCookie(name) {
        const v = `; ${document.cookie}`;
        const parts = v.split(`; ${name}=`);
        return parts.length === 2 ? parts.pop().split(';')[0] : '';
    }

    // Gets the held cash amount as a number.
    function getHeldCash() {
        const heldCashSpan = document.querySelector('.heldCash.cashhack');
        if (heldCashSpan) {
            const dataCash = heldCashSpan.getAttribute('data-cash');
            if (dataCash) {
                const cashString = dataCash.replace('Cash: $', '').replace(/,/g, '');
                return parseInt(cashString, 10);
            }
        }
        return 0; // Return 0 if element not found or cash not readable
    }

    // Fetches market listings for an item.
    async function fetchMarketListings(searchItemName) {
        const cacheKey = searchItemName.toLowerCase();
        const cached = marketCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
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
            searchname: searchItemName
        };
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: 'https://fairview.deadfrontier.com/onlinezombiemmo/trade_search.php',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': location.href,
                    'Origin': location.origin
                },
                data: Object.entries(payload)
                    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                    .join('&'),
                onload: function(response) {
                    const text = response.responseText;
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
                    listingsMap.forEach(listingData => {
                        const price = Number(listingData.price);
                        const quantity = Number(listingData.quantity);
                        if (listingData.itemname !== searchItemName) return;
                        let detectedListingColor = 'No Color';
                        if (listingData.item) {
                            const colorMatch = listingData.item.match(/_colour([A-Za-z]+)$/);
                            if (colorMatch && colors.map(c => c.toLowerCase()).includes(colorMatch[1].toLowerCase())) {
                                detectedListingColor = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1);
                            }
                        }
                        if (detectedListingColor === 'No Color' && listingData.colour && listingData.colour !== '-') {
                            const normalizedListingColor = listingData.colour.toLowerCase();
                            if (colors.map(c => c.toLowerCase()).includes(normalizedListingColor)) {
                                detectedListingColor = listingData.colour.charAt(0).toUpperCase() + listingData.colour.slice(1);
                            }
                        }
                        if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
                            listings.push({
                                itemCode: listingData.item || 'N/A',
                                itemName: listingData.itemname || 'N/A',
                                price: price,
                                quantity: quantity,
                                unitPrice: price / quantity,
                                color: detectedListingColor,
                                seller: listingData.member_name || 'N/A',
                                tradeId: listingData.trade_id || 'N/A'
                            });
                        }
                    });
                    marketCache.set(cacheKey, {
                        data: listings,
                        timestamp: Date.now()
                    });
                    resolve(listings);
                },
                onerror: function(error) {
                    reject([]);
                }
            });
        });
    }

    // Finds the cheapest listing for a specific color.
    function findCheapestListing(listings, targetColor) {
        const colorFilteredListings = listings.filter(listing => {
            if (targetColor === null || targetColor === 'None') {
                return listing.color === 'No Color';
            }
            return listing.color.toLowerCase() === targetColor.toLowerCase();
        });
        if (colorFilteredListings.length === 0) {
            return null;
        }
        return colorFilteredListings.sort((a, b) => a.unitPrice - b.unitPrice)[0];
    }

    // Formats a number with locale-specific separators.
    function formatNumber(num) {
        return num.toLocaleString();
    }

    if (currentPage === '15' && params.has('scripts')) {
        const action = params.get('scripts');
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (action === 'withdraw') {
                    const amt = params.get('amount') || '50000';
                    const input = document.querySelector('#withdraw');
                    const btn = document.querySelector('#wBtn');
                    if (input && btn) {
                        input.value = amt;
                        input.setAttribute('value', amt);
                        ['input','change'].forEach(e => input.dispatchEvent(new Event(e, { bubbles:true })));
                        if (typeof window.withdraw === 'function') {
                            window.withdraw();
                        } else {
                            btn.click();
                        }
                    }
                } else if (action === 'withdrawAll') {
                    if (typeof window.withdraw === 'function') {
                        window.withdraw(1);
                    } else {
                        document.querySelector("button[onclick='withdraw(1);']")?.click();
                    }
                } else if (action === 'deposit') {
                    const amt = params.get('amount');
                    if (amt) {
                        const input = document.querySelector('#deposit');
                        const btn = document.querySelector('#dBtn');
                        if (input && btn) {
                            input.value = amt;
                            input.setAttribute('value', amt);
                            ['input','change'].forEach(e => input.dispatchEvent(new Event(e, { bubbles:true })));
                            if (typeof window.deposit === 'function') {
                                window.deposit();
                            } else {
                                btn.click();
                            }
                        }
                    } else { // Deposit all
                        if (typeof window.deposit === 'function') {
                            window.deposit(1);
                        } else {
                            document.querySelector("button[onclick='deposit(1);']")?.click();
                        }
                    }
                }
            },200);
            setTimeout(() => {
                if (returnPage === '35') {
                    const p = sessionStorage.getItem(QUICKBUY_PENDING_STORAGE_KEY);
                    if (!p) {
                        sessionStorage.setItem('df_auto_restore','1');
                        window.location.replace(`${origin}${path}?page=${returnPage}`);
                    }
                } else if (returnPage) {
                      window.location.replace(`${origin}${path}?page=${returnPage}`);
                } else {
                    window.location.replace(`${origin}${path}`);
                }
            },500);
        });
        return;
    }

    // Extracts page number from button attributes.
    function getPageFromButton(button) {
        const dataPage = button.getAttribute('data-page');
        if (dataPage) {
            return dataPage;
        }
        const onclick = button.getAttribute('onclick');
        if (onclick && onclick.includes('changePage')) {
            const match = onclick.match(/changePage\((\d+)\)/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    // Applies dynamic styling to buttons.
    function applyButtonDynamicStyles(button, baseColor, hoverBgColor) {
        Object.assign(button.style, {
            width: '100%',
            padding: '12px 8px',
            backgroundColor: 'transparent', // Always transparent by default
            color: baseColor, // Set text color to baseColor
            border: `1px solid ${baseColor}`, // Set border color to baseColor
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 'bold',
            boxSizing: 'border-box',
            textShadow: 'none', // Explicitly remove any text shadow by default
            fontFamily: 'Comfortaa, sans-serif'
        });

        // Apply dynamic hover listeners
        button.removeEventListener('mouseenter', button.__hoverEnterListener);
        button.removeEventListener('mouseleave', button.__hoverLeaveListener);

        button.__hoverEnterListener = () => {
            button.style.backgroundColor = hoverBgColor; // Apply the specified hover background
            button.style.textShadow = 'none'; // Ensure no shadow on hover
        };
        button.__hoverLeaveListener = () => {
            button.style.backgroundColor = 'transparent'; // Return to transparent
            button.style.textShadow = 'none'; // Ensure no shadow off hover
        };
        button.addEventListener('mouseenter', button.__hoverEnterListener);
        button.addEventListener('mouseleave', button.__hoverLeaveListener);
    }


    // Finds and sets up hover panels for icons.
    function findAndSetupIcons() {
        const bankLink = document.querySelector('a[href="index.php?page=15"][title="Bank"]');
        if (bankLink) {
            setupBankHoverPanel(bankLink);
        }
        const marketplaceLink = document.querySelector('a[href="index.php?page=35"][title="Marketplace"]');
        if (marketplaceLink) {
            setupMarketHoverPanel(marketplaceLink);
        } else {
            setTimeout(findAndSetupIcons, 200);
        }

        const innerCityButton = document.querySelector('button[data-page="21"][data-mod="1"]');
        if (innerCityButton) {
            setupInnerCityHoverPanel(innerCityButton);
        }
    }

    // Sets up the bank hover panel with deposit/withdraw options.
    function setupBankHoverPanel(bankIcon) {
        if (currentPage === '35' && sessionStorage.getItem('df_auto_restore')) {
            sessionStorage.removeItem('df_auto_restore');
            const inp = document.getElementById('searchField');
            const last = localStorage.getItem('lastDFsearch');
            if (inp && last) {
                inp.value = last;
                inp.dispatchEvent(new Event('input',{bubbles:true}));
                setTimeout(()=> document.getElementById('makeSearch')?.click(),50);
            }
        }
        const hoverPanel = document.createElement('div');
        hoverPanel.id = 'auto-bank-hover-panel';
        Object.assign(hoverPanel.style, {
            position: 'absolute',
            background: 'rgba(0,0,0,0.9)',
            border: '2px solid #ff0000',
            borderRadius: '8px',
            color: '#ffd700',
            padding: '12px',
            width: '200px',
            zIndex: '99999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.7), 0 0 20px rgba(255,0,0,0.5)',
            fontFamily: 'Comfortaa, sans-serif',
            fontSize: '12px',
            display: 'none'
        });
        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            gap: '12px'
        });
        hoverPanel.appendChild(buttonContainer);
        const depositColumn = document.createElement('div');
        Object.assign(depositColumn.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: '1'
        });
        buttonContainer.appendChild(depositColumn);
        const depositInput = document.createElement('input');
        depositInput.type = 'text';
        depositInput.id = 'deposit-amount-input';
        depositInput.placeholder = 'Amount';
        depositInput.clickCount = 0;
        depositInput.autocomplete = 'off';
        Object.assign(depositInput.style, {
            width: '100%',
            padding: '8px',
            background: '#222',
            color: '#00ff00',
            border: '1px solid #00aa00',
            borderRadius: '4px',
            fontSize: '11px',
            textAlign: 'center',
            boxSizing: 'border-box',
            fontFamily: 'Comfortaa, sans-serif'
        });
        depositColumn.appendChild(depositInput);
        const depositButton = document.createElement('button');
        depositButton.textContent = 'Deposit All';
        Object.assign(depositButton.style, {
            width: '100%',
            padding: '16px 8px',
            background: 'transparent', // Make background transparent initially
            color: '#00ff00',
            border: '1px solid #00aa00',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 'bold',
            textShadow: 'none', // Ensure no text shadow by default
            fontFamily: 'Comfortaa, sans-serif'
        });
        depositColumn.appendChild(depositButton);
        const withdrawColumn = document.createElement('div');
        Object.assign(withdrawColumn.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: '1'
        });
        buttonContainer.appendChild(withdrawColumn);
        const withdrawInput = document.createElement('input');
        withdrawInput.type = 'text';
        withdrawInput.id = 'withdraw-amount-input';
        withdrawInput.placeholder = 'Amount';
        withdrawInput.clickCount = 0;
        withdrawInput.autocomplete = 'off';
        Object.assign(withdrawInput.style, {
            width: '100%',
            padding: '8px',
            background: '#222',
            color: '#ff0000',
            border: '1px solid #aa0000',
            borderRadius: '4px',
            fontSize: '11px',
            textAlign: 'center',
            boxSizing: 'border-box',
            fontFamily: 'Comfortaa, sans-serif'
        });
        withdrawColumn.appendChild(withdrawInput);
        const withdrawButton = document.createElement('button');
        withdrawButton.textContent = 'Withdraw All';
        Object.assign(withdrawButton.style, {
            width: '100%',
            padding: '16px 8px',
            background: 'transparent', // Make background transparent initially
            color: '#ff0000',
            border: '1px solid #aa0000',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: 'bold',
            textShadow: 'none', // Ensure no text shadow by default
            fontFamily: 'Comfortaa, sans-serif'
        });
        withdrawColumn.appendChild(withdrawButton);

        function updateDepositButtonText() {
            const amount = depositInput.value.trim();
            depositButton.textContent = amount ? 'Deposit' : 'Deposit All';
        }

        function updateWithdrawButtonText() {
            const amount = withdrawInput.value.trim();
            withdrawButton.textContent = amount ? 'Withdraw' : 'Withdraw All';
        }

        depositInput.addEventListener('click', () => {
            if (depositInput.clickCount === 0) {
                depositInput.select();
                depositInput.clickCount = 1;
            } else {
                const currentIndex = AMOUNTS.indexOf(depositInput.value);
                const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % AMOUNTS.length;
                depositInput.value = AMOUNTS[nextIndex];
                depositInput.clickCount++;
                updateDepositButtonText();
            }
        });
        depositInput.addEventListener('input', (e) => {
            if (!AMOUNTS.includes(e.target.value)) {
                depositInput.clickCount = 1;
            }
            updateDepositButtonText();
        });
        withdrawInput.addEventListener('click', () => {
            if (withdrawInput.clickCount === 0) {
                withdrawInput.select();
                withdrawInput.clickCount = 1;
            } else {
                const currentIndex = AMOUNTS.indexOf(withdrawInput.value);
                const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % AMOUNTS.length;
                withdrawInput.value = AMOUNTS[nextIndex];
                withdrawInput.clickCount++;
                updateWithdrawButtonText();
            }
        });
        withdrawInput.addEventListener('input', (e) => {
            if (!AMOUNTS.includes(e.target.value)) {
                withdrawInput.clickCount = 1;
            }
            updateWithdrawButtonText();
        });

        updateDepositButtonText();
        updateWithdrawButtonText();

        const depositHoverBg = '#1a3d1a';
        depositButton.addEventListener('mouseenter', () => {
            depositButton.style.background = depositHoverBg;
            depositButton.style.borderColor = '#00ff00';
            depositButton.style.textShadow = 'none';
        });
        depositButton.addEventListener('mouseleave', () => {
            depositButton.style.background = 'transparent';
            depositButton.style.borderColor = '#00aa00';
            depositButton.style.textShadow = 'none';
        });

        const withdrawHoverBg = '#3d1a1a';
        withdrawButton.addEventListener('mouseenter', () => {
            withdrawButton.style.background = withdrawHoverBg;
            withdrawButton.style.borderColor = '#ff0000';
            withdrawButton.style.textShadow = 'none';
        });
        withdrawButton.addEventListener('mouseleave', () => {
            withdrawButton.style.background = 'transparent';
            withdrawButton.style.borderColor = '#aa0000';
            withdrawButton.style.textShadow = 'none';
        });
        depositButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentPage === '35') {
                const searchInput = document.getElementById('searchField');
                if (searchInput) {
                    localStorage.setItem('lastDFsearch', searchInput.value);
                }
            }
            const amount = depositInput.value.trim();
            let url = `${origin}${path}?page=15&scripts=deposit`;
            if (amount) {
                const cleanAmount = amount.replace(/,/g, '');
                url += `&amount=${cleanAmount}`;
            }
            url += `&originPage=${currentPage}`;
            window.location.replace(url);
        });
        withdrawButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentPage === '35') {
                const searchInput = document.getElementById('searchField');
                if (searchInput) {
                    localStorage.setItem('lastDFsearch', searchInput.value);
                }
            }
            const amount = withdrawInput.value.trim();
            let url = `${origin}${path}?page=15&scripts=${amount ? 'withdraw' : 'withdrawAll'}`;
            if (amount) {
                const cleanAmount = amount.replace(/,/g, '');
                url += `&amount=${cleanAmount}`;
            }
            url += `&originPage=${currentPage}`;
            window.location.replace(url);
        });
        document.body.appendChild(hoverPanel);
        addHoverLogic(bankIcon, hoverPanel);
    }

    // Sets up the inner city hover panel for depositing cash.
    function setupInnerCityHoverPanel(innerCityButton) {
        const heldCash = getHeldCash();
        if (heldCash === 0) {
            return;
        }
        const textAddon = document.getElementById('textAddon');
        if (textAddon) {
            textAddon.remove();
        }

        const hoverPanel = document.createElement('div');
        hoverPanel.id = 'auto-innercity-hover-panel';
        Object.assign(hoverPanel.style, {
            position: 'fixed',
            background: 'rgba(0,0,0,0.9)',
            border: '2px solid #ff0000',
            borderRadius: '8px',
            color: '#ff0000',
            padding: '10px',
            width: '140px',
            zIndex: '99999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.7), 0 0 20px rgba(255,0,0,0.5)',
            fontFamily: 'Comfortaa, sans-serif',
            fontSize: '12px',
            display: 'none'
        });

        const depositButton = document.createElement('button');
        depositButton.textContent = 'Deposit All';
        applyButtonDynamicStyles(depositButton, '#ff0000', '#3d1a1a');
        hoverPanel.appendChild(depositButton);
        depositButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentPage === '35') {
                const searchInput = document.getElementById('searchField');
                if (searchInput) {
                    localStorage.setItem('lastDFsearch', searchInput.value);
                }
            }
            let url = `${origin}${path}?page=15&scripts=deposit&originPage=21`;
            window.location.replace(url);
        });
        document.body.appendChild(hoverPanel);
        addHoverLogic(innerCityButton, hoverPanel, true);
    }

    // Sets up the market hover panel with quick buy options.
    async function setupMarketHoverPanel(marketIcon) {
        const hoverPanel = document.createElement('div');
        hoverPanel.id = 'auto-market-hover-panel';
        Object.assign(hoverPanel.style, {
            position: 'absolute',
            background: 'rgba(0,0,0,0.9)',
            border: '2px solid #FF0000',
            borderRadius: '8px',
            color: '#FFFFFF',
            padding: '10px',
            width: '880px',
            zIndex: '99999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.7), 0 0 20px rgba(255,0,0,0.5)',
            fontFamily: 'Comfortaa, sans-serif',
            fontSize: '12px',
            display: 'none'
        });
        const mainContent = document.createElement('div');
        Object.assign(mainContent.style, {
            display: 'flex',
            flexDirection: 'row',
            gap: '20px',
            justifyContent: 'flex-start',
            width: '100%'
        });
        hoverPanel.appendChild(mainContent);

        // Medical Section (left)
        const medicalSection = document.createElement('div');
        medicalSection.style.width = '360px'; // Fixed width for 3 columns
        const medicalContent = document.createElement('div');
        Object.assign(medicalContent.style, {
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            width: '100%'
        });
        medicalSection.appendChild(medicalContent);
        mainContent.appendChild(medicalSection);

        const bulletsSection = document.createElement('div');
        bulletsSection.style.width = '120px'; // Fixed width for 1 column
        const bulletsContent = document.createElement('div');
        Object.assign(bulletsContent.style, {
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            width: '100%'
        });
        bulletsSection.appendChild(bulletsContent);
        mainContent.appendChild(bulletsSection);
        const foodSection = document.createElement('div');
        foodSection.style.width = '360px'; // Fixed width for 3 columns
        const foodContent = document.createElement('div');
        Object.assign(foodContent.style, {
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            width: '100%'
        });
        foodSection.appendChild(foodContent);
        mainContent.appendChild(foodSection);
        document.body.appendChild(hoverPanel);
        const medicalItemDataPromises = new Map();
        const medicalUnitPricesPerHealing = new Map();
        const medicalCheapestListings = new Map();
        const bulletItemDataPromises = new Map();
        const bulletUnitPricesPerUnit = new Map();
        const bulletCheapestListings = new Map();
        const foodItemDataPromises = new Map();
        const foodUnitPricesPerHunger = new Map();
        const foodCheapestListings = new Map();
        for (const itemConfig of MEDICAL_ITEMS) {
            const name = itemConfig.name;
            const healingValue = itemConfig.healingValue;
            const sanitizedName = name.toLowerCase().replace(/\s+/g, '');
            let imageFilename = sanitizedName;
            if (sanitizedName.includes('nerotonin')) {
                imageFilename = 'nerotonin';
            }
            const image = `https://files.deadfrontier.com/deadfrontier/inventoryimages/large/${imageFilename}.png`;
            const buttonId = `${sanitizedName}-medical-quickbuy-btn`;
            const priceDisplayId = `medical-price-display-${sanitizedName}`;
            const itemBlock = createItemBlock(name, image, buttonId, priceDisplayId, 'Medical', healingValue);
            medicalContent.appendChild(itemBlock);
            medicalItemDataPromises.set(name, processItemData(name, healingValue, buttonId, priceDisplayId, medicalUnitPricesPerHealing, medicalCheapestListings, 'healing'));
        }

        for (const itemConfig of BULLET_ITEMS) {
            const name = itemConfig.name;
            const sanitizedName = name.toLowerCase().replace(/\s+/g, '');
            const imageFilename = getBulletImageFilename(name);
            const image = `https://files.deadfrontier.com/deadfrontier/inventoryimages/large/${imageFilename}.png`;
            const buttonId = `${sanitizedName}-bullet-quickbuy-btn`;
            const priceDisplayId = `bullet-price-display-${sanitizedName}`;
            const valueDisplayId = `bullet-value-display-${sanitizedName}`;
            const itemBlock = createItemBlock(name, image, buttonId, priceDisplayId, 'Bullet', null, valueDisplayId);
            bulletsContent.appendChild(itemBlock);
            bulletItemDataPromises.set(name, processItemData(name, 1, buttonId, priceDisplayId, bulletUnitPricesPerUnit, bulletCheapestListings, 'bullet', valueDisplayId));
        }

        for (const itemConfig of FOOD_ITEMS) {
            const name = itemConfig.name;
            const hungerValue = itemConfig.hungerValue;
            const sanitizedName = name.toLowerCase().replace(/\s+/g, '');
            let imageFilename = sanitizedName;
            if (sanitizedName.includes('nerotonin')) {
                imageFilename = 'nerotonin';
            }
            if (sanitizedName.startsWith('tinned')) {
                imageFilename = sanitizedName.replace(/^tinned/, '');
            }
            const image = `https://files.deadfrontier.com/deadfrontier/inventoryimages/large/${imageFilename}.png`;
            const buttonId = `${sanitizedName}-food-quickbuy-btn`;
            const priceDisplayId = `food-price-display-${sanitizedName}`;
            const itemBlock = createItemBlock(name, image, buttonId, priceDisplayId, 'Food', hungerValue);
            foodContent.appendChild(itemBlock);
            foodItemDataPromises.set(name, processItemData(name, hungerValue, buttonId, priceDisplayId, foodUnitPricesPerHunger, foodCheapestListings, 'hunger'));
        }

        function createItemBlock(name, imageSrc, buttonId, priceDisplayId, category, value, valueDisplayId = null) {
            const itemBlock = document.createElement('div');
            Object.assign(itemBlock.style, {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '5px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '3px',
                gap: '2px',
                flex: '0 0 auto',
                width: '110px',
                height: 'auto',
                boxSizing: 'border-box',
                textAlign: 'center',
                fontFamily: 'Comfortaa, sans-serif'
            });
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = name;
            Object.assign(img.style, {
                width: '36px',
                height: '36px',
                flexShrink: '0',
                marginBottom: '4px'
            });
            itemBlock.appendChild(img);

            // Name container with fixed height for alignment (supports up to two lines)
            const nameContainer = document.createElement('div');
            Object.assign(nameContainer.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '2.4em',
                width: '100%'
            });
            const itemNameSpan = document.createElement('span');
            itemNameSpan.textContent = name;
            Object.assign(itemNameSpan.style, {
                fontWeight: 'bold',
                color: '#FFF',
                textAlign: 'center',
                fontSize: '13px',
                lineHeight: '1.2',
                fontFamily: 'Comfortaa, sans-serif'
            });
            nameContainer.appendChild(itemNameSpan);
            itemBlock.appendChild(nameContainer);

            // Value span (plain number in white, or loading for bullets)
            const valueSpan = document.createElement('span');
            if (category === 'Bullet') {
                valueSpan.textContent = 'Loading...';
                if (valueDisplayId) {
                    valueSpan.id = valueDisplayId;
                }
                Object.assign(valueSpan.style, {
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '11px',
                    lineHeight: '1.2',
                    fontFamily: 'Comfortaa, sans-serif'
                });
            } else {
                valueSpan.textContent = value.toString();
                Object.assign(valueSpan.style, {
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '11px',
                    lineHeight: '1.2',
                    fontFamily: 'Comfortaa, sans-serif'
                });
            }
            itemBlock.appendChild(valueSpan);

            const priceSpan = document.createElement('span');
            priceSpan.textContent = 'Loading...';
            priceSpan.id = priceDisplayId;
            Object.assign(priceSpan.style, {
                color: '#FFD700',
                textAlign: 'center',
                fontSize: '13px',
                lineHeight: '1.2',
                fontFamily: 'Comfortaa, sans-serif'
            });
            itemBlock.appendChild(priceSpan);

            const quickBuyButton = document.createElement('button');
            quickBuyButton.textContent = 'Buy';
            quickBuyButton.id = buttonId;
            applyButtonDynamicStyles(quickBuyButton, '#FFD700', 'rgba(255,215,0,0.3)');
            itemBlock.appendChild(quickBuyButton);
            quickBuyButton.style.pointerEvents = 'none';
            return itemBlock;
        }

        async function processItemData(name, value, buttonId, priceDisplayId, unitPricesMap, cheapestListingsMap, type, valueDisplayId = null) {
            try {
                const allListings = await fetchMarketListings(name);
                const limitedListings = allListings.slice(0, 10);
                if (type === 'bullet') {
                }
                let cheapestPrice = 'N/A';
                let currentItemUnitPricePerPoint = Infinity;
                let cheapestItemListing = null;
                if (limitedListings.length > 0) {
                    const { baseName, color: itemColor } = processItemName(name);
                    const cheapestListing = findCheapestListing(limitedListings, itemColor);
                    if (cheapestListing) {
                        if (type === 'bullet') {
                            cheapestPrice = `$${formatNumber(cheapestListing.price)}`;
                            currentItemUnitPricePerPoint = cheapestListing.unitPrice;
                            if (valueDisplayId) {
                                const valueElement = document.getElementById(valueDisplayId);
                                if (valueElement) {
                                    valueElement.textContent = formatNumber(cheapestListing.quantity);
                                    valueElement.style.color = '#FFFFFF';
                                }
                            }
                        } else {
                            cheapestPrice = `$${formatNumber(Math.floor(cheapestListing.unitPrice))}`;
                            currentItemUnitPricePerPoint = cheapestListing.unitPrice / value;
                        }
                        cheapestItemListing = cheapestListing;
                    } else {
                        if (valueDisplayId) {
                            const valueElement = document.getElementById(valueDisplayId);
                            if (valueElement) {
                                valueElement.textContent = 'N/A';
                                valueElement.style.color = '#FF0000';
                            }
                        }
                    }
                } else {
                    if (valueDisplayId) {
                        const valueElement = document.getElementById(valueDisplayId);
                        if (valueElement) {
                            valueElement.textContent = 'N/A';
                            valueElement.style.color = '#FF0000';
                        }
                    }
                }

                const priceElement = document.getElementById(priceDisplayId);
                if (priceElement) {
                    priceElement.textContent = cheapestPrice;
                }
                unitPricesMap.set(name, currentItemUnitPricePerPoint);
                cheapestListingsMap.set(name, cheapestItemListing);

                const buyButton = document.getElementById(buttonId);
                if (buyButton) {
                    if (cheapestItemListing) {
                        buyButton.removeAttribute('disabled');
                        buyButton.style.opacity = '1';
                        buyButton.style.pointerEvents = 'auto';
                        buyButton.onclick = () => {
                            quickBuy(cheapestItemListing.itemName, cheapestItemListing.quantity, 1);
                        };
                    } else {
                        buyButton.setAttribute('disabled', 'true');
                        buyButton.style.opacity = '0.5';
                        buyButton.style.cursor = 'not-allowed';
                        buyButton.style.pointerEvents = 'none';
                        buyButton.onclick = null;
                        if (priceElement) {
                            priceElement.style.color = '#FF0000';
                        }
                        applyButtonDynamicStyles(buyButton, '#FF0000', '#3d1a1a');
                    }
                }
                return {
                    name: name,
                    unitPricePerPoint: currentItemUnitPricePerPoint
                };
            } catch (error) {

                const priceElement = document.getElementById(priceDisplayId);
                if (priceElement) {
                    priceElement.textContent = 'Error';
                    priceElement.style.color = '#FF0000';
                }
                if (valueDisplayId) {
                    const valueElement = document.getElementById(valueDisplayId);
                    if (valueElement) {
                        valueElement.textContent = 'N/A';
                        valueElement.style.color = '#FF0000';
                    }
                }
                const buyButton = document.getElementById(buttonId);
                if (buyButton) {
                    buyButton.setAttribute('disabled', 'true');
                    buyButton.style.opacity = '0.5';
                    buyButton.style.cursor = 'not-allowed';
                    buyButton.style.pointerEvents = 'none';
                    buyButton.onclick = null;
                    applyButtonDynamicStyles(buyButton, '#FF0000', '#3d1a1a');
                }
                unitPricesMap.set(name, Infinity);
                return {
                    name: name,
                    unitPricePerPoint: Infinity
                };
            }
        }

        addHoverLogic(marketIcon, hoverPanel);
        Promise.all(Array.from(medicalItemDataPromises.values())).then(() => {
            colorItems(MEDICAL_ITEMS, medicalUnitPricesPerHealing, 'medical');
        });
        Promise.all(Array.from(bulletItemDataPromises.values())).then(() => {
            colorItems(BULLET_ITEMS, bulletUnitPricesPerUnit, 'bullet');
        });
        Promise.all(Array.from(foodItemDataPromises.values())).then(() => {
            colorItems(FOOD_ITEMS, foodUnitPricesPerHunger, 'food');
        });

        function colorItems(itemsArray, unitPricesMap, category) {
            let allItems;
            if (category !== 'bullet') {
                allItems = Array.from(unitPricesMap.entries())
                    .filter(([_, price]) => price !== Infinity)
                    .sort(([,a], [,b]) => a - b);
            }
            itemsArray.forEach(itemConfig => {
                const name = itemConfig.name;
                const sanitizedName = name.toLowerCase().replace(/\s+/g, '');
                const pricePerPoint = unitPricesMap.get(name);
                const buttonId = `${sanitizedName}-${category}-quickbuy-btn`;
                const priceDisplayId = `${category}-price-display-${sanitizedName}`;
                const button = document.getElementById(buttonId);
                const priceDisplay = document.getElementById(priceDisplayId);
                if (!button || !priceDisplay) return;
                const greenPrimary = '#00FF00';
                const redPrimary = '#FF0000';
                const bluePrimary = '#0066FF';
                const greenHoverBg = '#1a3d1a';
                const redHoverBg = '#3d1a1a';
                const blueHoverBg = 'rgba(0,85,255,0.3)';
                const isUnavailable = pricePerPoint === Infinity;
                let baseColor, hoverBg, priceColor;
                if (category === 'bullet') {
                    if (isUnavailable) {
                        baseColor = redPrimary;
                        hoverBg = redHoverBg;
                        priceColor = redPrimary;
                    } else {
                        baseColor = bluePrimary;
                        hoverBg = blueHoverBg;
                        priceColor = bluePrimary;
                    }
                } else {
                    if (isUnavailable) {
                        baseColor = redPrimary;
                        hoverBg = redHoverBg;
                        priceColor = redPrimary;
                    } else if (allItems.length > 0 && pricePerPoint === allItems[0][1]) {
                        baseColor = greenPrimary;
                        hoverBg = greenHoverBg;
                        priceColor = greenPrimary;
                    } else {
                        baseColor = redPrimary;
                        hoverBg = redHoverBg;
                        priceColor = redPrimary;
                    }
                }
                applyButtonDynamicStyles(button, baseColor, hoverBg);
                priceDisplay.style.color = priceColor;
            });
        }
    }
    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    // Adds hover logic to show/hide panels.
    function addHoverLogic(iconElement, panelElement, staticBelowIcon = false) {
        let hoverTimer = null;
        let isOverPanel = false;
        let isOverIcon = false;
        let scrollHandler = null;
        function showPanel() {
            panelElement.style.display = 'block';
            const panelWidth = panelElement.offsetWidth;
            const panelHeight = panelElement.offsetHeight;
            panelElement.style.display = 'none'; // Temporarily hide to get correct dimensions
            let left, top;
            if (staticBelowIcon) {
                const rect = iconElement.getBoundingClientRect();
                left = rect.left + (rect.width / 2) - (panelWidth / 2);
                top = rect.bottom + 5;
            } else {
                left = mouseX - (panelWidth / 2);
                top = mouseY + 15;
            }
            const viewportBuffer = 10;
            if (left < viewportBuffer) {
                left = viewportBuffer;
            } else if (left + panelWidth > window.innerWidth - viewportBuffer) {
                left = window.innerWidth - panelWidth - viewportBuffer;
            }
            if (top + panelHeight > window.innerHeight - viewportBuffer) {
                top = mouseY - panelHeight - 15;
                if (top < viewportBuffer) {
                    top = viewportBuffer;
                }
            }
            if (top < viewportBuffer && mouseY + 15 < window.innerHeight - panelHeight - viewportBuffer) {
                top = mouseY + 15;
            }
            panelElement.style.left = left + 'px';
            panelElement.style.top = top + 'px';
            panelElement.style.display = 'block';
            if (staticBelowIcon) {
                scrollHandler = () => {
                    if (panelElement.style.display !== 'none') {
                        const rect = iconElement.getBoundingClientRect();
                        const newLeft = rect.left + (rect.width / 2) - (panelWidth / 2);
                        const newTop = rect.bottom + 5;
                        panelElement.style.left = newLeft + 'px';
                        panelElement.style.top = newTop + 'px';
                    }
                };
                window.addEventListener('scroll', scrollHandler);
            }
        }

        function hidePanel() {
            panelElement.style.display = 'none';
            if (scrollHandler) {
                window.removeEventListener('scroll', scrollHandler);
                scrollHandler = null;
            }
        }
        iconElement.addEventListener('mouseenter', () => {
            isOverIcon = true;
            clearTimeout(hoverTimer);
            showPanel();
        });
        iconElement.addEventListener('mouseleave', () => {
            isOverIcon = false;
            hoverTimer = setTimeout(() => {
                if (!isOverPanel) {
                    hidePanel();
                }
            }, 100);
        });
        panelElement.addEventListener('mouseenter', () => {
            isOverPanel = true;
            clearTimeout(hoverTimer);
        });
        panelElement.addEventListener('mouseleave', () => {
            isOverPanel = false;
            hoverTimer = setTimeout(() => {
                if (!isOverIcon) {
                    hidePanel();
                }
            }, 100);
        });
    }

    // Initializes the script functionality.
    function init() {
        findAndSetupIcons();
        if (window.location.search.includes('page=35')) {
            const p = sessionStorage.getItem(QUICKBUY_PENDING_STORAGE_KEY);
            if (p) {
                const { term, qty, count } = JSON.parse(p);
                sessionStorage.removeItem(QUICKBUY_PENDING_STORAGE_KEY);
                const maxAttempts = 20;
                let attempts = 0;
                const pollForSearchElements = setInterval(() => {
                    const input = document.querySelector('#searchField');
                    const mk = document.querySelector('#makeSearch');
                    if (input && mk) {
                        clearInterval(pollForSearchElements);
                        input.value = term;
                        realClick(mk);
                        setTimeout(() => purchaseMultiple(term, qty, count), 500);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollForSearchElements);
                    }
                    attempts++;
                }, 100);
            }
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();