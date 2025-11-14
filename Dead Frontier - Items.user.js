// ==UserScript==
// @name                         Dead Frontier - Items
// @version                      1.0
// @description               Fixes colored items images and adjusts weapon image zoom (Optimized with mask fallback)
// @author                      XeiDaMoKa [2373510]
// @source                      https://xeidamoka.notion.site/Dead-Frontier-Layouts-2a02a9c404f780acbeb6f82c95f72d91
// @downloadURL          https://github.com/XeiDaMoKa/Torn/raw/Xei/Scripts/Aquarius//ChainWatchers.user.js
// @updateURL              https://github.com/XeiDaMoKa/Torn/raw/Xei/Scripts/Aquarius//ChainWatchers.user.js
// @supportURL             https://fairview.deadfrontier.com/onlinezombiemmo/index.php?action=pm;sa=send
// @supportURL             https://github.com/XeiDaMoKa/Torn/issues
// @match                       https://fairview.deadfrontier.com/*
// @icon                           https://www.google.com/s2/favicons?sz=64&domain=deadfrontier.com
// ==/UserScript==

(function () {
    'use strict';

    // Defines user gender for avatar paths.
    const UserGender = [
        'male'
    ];

    // Maps item types to keywords for automatic base type detection.
    const BASE_TYPE_KEYWORDS = {
        'mask': [
            'helmet',
            'mask',
            'exterminatorhelmet',
            'halloweenmask'
        ],
        'armour': [
            'armour',
            'armor',
            'vest',
            'reactive',
            'kevlar',
            'tactical',
            'military',
            'combat',
            'ballistic',
            'protective',
            'body armor',
            'slx',
            'flak',
            'platecarrier',
            'riotgear'
        ],
        'trousers': [
            'trousers',
            'pants',
            'jeans'
        ],
        'coat': [
            'coat',
            'jacket'
        ],
        'hat': [
            'hat',
            'bandana',
            'cap',
            'beanie'
        ],
        'shirt': [
            'shirt',
            'tshirt',
            'tee',
            'top'
        ],
        'weapon': [
            'weapon',
            'gun',
            'rifle'
        ]
    };

    // Supported color variants for items.
    const validColors = [
        'white',
        'grey',
        'black',
        'brown',
        'red',
        'blue',
        'green',
        'yellow',
        'purple',
        'orange',
        'cyan',
        'pink',
        'desert camo',
        'forest camo',
        'urban camo'
    ];

    // Transparent placeholder image.
    const transparentSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // State variables for tooltip and armor processing.
    let customStylesApplied = false;
    let lastHoveredItem = null;
    let processingTooltip = false;
    let armorSlotObserver = null;
    let sidebarImgObserver = null;
    let durabilityObserver = null;
    let lastProcessedArmor = null;

    // Storage keys for equipped armor.
    const STORAGE_KEY_ARMOR_TYPE = 'df_equipped_armor_type';
    const STORAGE_KEY_ARMOR_BASETYPE = 'df_equipped_armor_basetype';

    // Saves equipped armor to local storage.
    function saveArmorToStorage(itemType, baseType) {
        try {
            localStorage.setItem(STORAGE_KEY_ARMOR_TYPE, itemType);
            localStorage.setItem(STORAGE_KEY_ARMOR_BASETYPE, baseType);
        } catch (e) {}
    }

    // Loads equipped armor from local storage.
    function loadArmorFromStorage() {
        try {
            const itemType = localStorage.getItem(STORAGE_KEY_ARMOR_TYPE);
            const baseType = localStorage.getItem(STORAGE_KEY_ARMOR_BASETYPE);
            if (itemType && baseType) {
                return { itemType, baseType };
            }
        } catch (e) {}
        return null;
    }

    // Clears equipped armor from local storage.
    function clearArmorStorage() {
        try {
            localStorage.removeItem(STORAGE_KEY_ARMOR_TYPE);
            localStorage.removeItem(STORAGE_KEY_ARMOR_BASETYPE);
        } catch (e) {}
    }

    // Loads image with fallback for masks.
    function loadImageWithFallback(url, fallbackFolder, onSuccess, onFail) {
        const img = new Image();
        img.onload = () => onSuccess(url);
        img.onerror = () => {
            if (fallbackFolder === 'mask2') {
                const fallbackUrl = url.replace('/mask/', '/mask2/');
                const retryImg = new Image();
                retryImg.onload = () => onSuccess(fallbackUrl);
                retryImg.onerror = () => onFail();
                retryImg.src = fallbackUrl;
            } else {
                onFail();
            }
        };
        img.src = url;
    }

    // Generates URL for colored item images.
    function getColoredImageUrl(itemType, baseType) {
        if (!baseType) return null;
        const lowerItemType = itemType.toLowerCase();
        const colorMatch = itemType.match(/_colour([a-z]+(?: [a-z]+)?)(?:_|$)/i);
        if (colorMatch) {
            const color = colorMatch[1].toLowerCase();
            if (validColors.includes(color)) {
                const gender = UserGender[0];
                const cleanItemType = itemType.substring(0, itemType.indexOf('_colour') + `_colour${color}`.length);
                let folder = baseType;
                return { url: `https://files.deadfrontier.com/deadfrontier/avatars/${gender}/${folder}/${cleanItemType}.png`, baseType };
            }
        }
        return null;
    }

    // Determines base type from item type keywords.
    function getBaseTypeFromItemType(itemType) {
        const lowerItemType = itemType.toLowerCase();
        for (const [baseType, keywords] of Object.entries(BASE_TYPE_KEYWORDS)) {
            for (const keyword of keywords) {
                if (lowerItemType.includes(keyword.toLowerCase())) {
                    return baseType;
                }
            }
        }
        return null;
    }

    // Applies colored image to element with fallback.
    function applyImageWithFallback(element, imageData, styles = {}) {
        if (!imageData || !imageData.url) return;
        const { url, baseType } = imageData;
        const isMask = baseType === 'mask';
        const fallbackFolder = isMask ? 'mask2' : null;
        loadImageWithFallback(url, fallbackFolder, (finalUrl) => {
            element.style.backgroundImage = `url("${finalUrl}")`;
            Object.assign(element.style, styles);
            element.dataset.processed = 'true';
        }, () => {
            element.style.backgroundImage = '';
            element.dataset.processed = 'false';
        });
    }

    // Updates sidebar armor display with colored image.
    function updateSidebarArmour() {
        const sidebar = document.getElementById('sidebarArmour');
        if (!sidebar) return;

        const img = sidebar.querySelector('img');
        if (!img) return;

        const durabilityDiv = sidebar.querySelector('div.opElem');
        const armorSlot = document.querySelector('[data-slottype="armour"] .item');

        let itemType = '';
        let baseType = 'armour';

        if (armorSlot) {

            itemType = armorSlot.dataset.type || '';
            baseType = armorSlot.dataset.itemtype;
            if (!baseType) {
                baseType = getBaseTypeFromItemType(itemType);
            }


            if (itemType) {
                saveArmorToStorage(itemType, baseType);
            } else {
                clearArmorStorage();
            }
        } else {

            const storedArmor = loadArmorFromStorage();


            if (storedArmor) {
                itemType = storedArmor.itemType;
                baseType = storedArmor.baseType;

            } else {

                const imgSrc = img.src;


                if (!imgSrc || imgSrc === transparentSrc || imgSrc.includes('data:image')) {

                    img.style.backgroundImage = '';
                    img.style.backgroundPosition = '';
                    img.style.backgroundSize = '';
                    img.style.backgroundRepeat = '';
                    img.style.backgroundColor = '';
                    img.style.filter = '';
                    img.dataset.processed = 'false';
                    if (durabilityDiv) {
                        durabilityDiv.style.display = 'none';
                    }
                    return;
                }
            }
        }

        if (durabilityDiv) {
            durabilityDiv.style.display = '';
        }

        if (baseType !== 'armour') {

            img.style.backgroundImage = '';
            img.style.backgroundPosition = '';
            img.style.backgroundSize = '';
            img.style.backgroundRepeat = '';
            img.style.backgroundColor = '';
            img.style.filter = '';
            img.dataset.processed = 'false';
            return;
        }

        const newImageData = getColoredImageUrl(itemType, baseType);


        if (newImageData) {

            if (img.src !== transparentSrc) {
                img.src = transparentSrc;
            }
            img.style.width = '40px';
            img.style.height = '40px';
            applyImageWithFallback(img, newImageData, {
                backgroundPosition: '-6px -14.5px',
                backgroundSize: '125%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent'
            });
        } else {

            img.style.backgroundImage = '';
            img.style.backgroundPosition = '';
            img.style.backgroundSize = '';
            img.style.backgroundRepeat = '';
            img.style.backgroundColor = '';
            img.dataset.processed = 'false';
        }


    }

    // Observes armor durability changes.
    function setupDurabilityObserver(sidebar) {
        if (durabilityObserver) {
            durabilityObserver.disconnect();
            durabilityObserver = null;
        }
        const durabilityDiv = sidebar.querySelector('div.opElem');
        if (!durabilityDiv) return;
        durabilityObserver = new MutationObserver(() => {
            // Durability changes handled by layouts script
        });
        durabilityObserver.observe(durabilityDiv, {
            attributes: true,
            attributeFilter: ['style'],
            characterData: true,
            childList: true,
            subtree: true
        });
    }

    // Observes armor slot changes.
    function setupArmorSlotObserver() {
        if (armorSlotObserver) {
            armorSlotObserver.disconnect();
            armorSlotObserver = null;
        }
        const armorSlotContainer = document.querySelector('[data-slottype="armour"]');
        if (!armorSlotContainer) return;
        const armorSlot = armorSlotContainer.querySelector('.item');
        if (!armorSlot) return;
        armorSlotObserver = new MutationObserver((mutations) => {
            let needsUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    if (mutation.attributeName === 'data-type' || mutation.attributeName === 'data-itemtype') {
                        needsUpdate = true;
                    }
                } else if (mutation.type === 'childList') {
                    needsUpdate = true;
                }
            });
            if (needsUpdate) updateSidebarArmour();
        });
        armorSlotObserver.observe(armorSlot, {
            attributes: true,
            attributeFilter: ['data-type', 'data-itemtype'],
            childList: true
        });
    }

    // Observes sidebar image changes.
    function setupSidebarImgObserver(sidebar) {
        if (sidebarImgObserver) {
            sidebarImgObserver.disconnect();
            sidebarImgObserver = null;
        }
        const img = sidebar.querySelector('img');
        if (!img) return;
        sidebarImgObserver = new MutationObserver((mutations) => {
            let needsUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    const newSrc = mutation.target.src;
                    if (newSrc !== transparentSrc) needsUpdate = true;
                }
            });
            if (needsUpdate) setTimeout(updateSidebarArmour, 100);
        });
        sidebarImgObserver.observe(img, {
            attributes: true,
            attributeFilter: ['src']
        });
    }

    // Sets up observers for sidebar armor container.
    function setupSidebarContainerObserver() {
        const sidebar = document.getElementById('sidebarArmour');
        if (!sidebar) return;
        const childObserver = new MutationObserver((mutations) => {
            let needsUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    needsUpdate = true;
                }
            });
            if (needsUpdate) setTimeout(updateSidebarArmour, 50);
            const img = sidebar.querySelector('img');
            if (img && !img.dataset.sidebarObserver) {
                setupSidebarImgObserver(sidebar);
                img.dataset.sidebarObserver = 'true';
            }
            setupDurabilityObserver(sidebar);
            setupArmorSlotObserver();
        });
        childObserver.observe(sidebar, {
            childList: true,
            subtree: true,
            characterData: true
        });
        setupSidebarImgObserver(sidebar);
        setupDurabilityObserver(sidebar);
        setupArmorSlotObserver();
        updateSidebarArmour();
    }

    // Applies colored images to inventory and collection items.
    function updateItemImages() {
        const items = document.querySelectorAll('.item:not([data-processed]), .fakeItem:not([data-processed])');
        items.forEach(item => {
            const itemType = item.dataset.type || '';
            let baseType = item.dataset.itemtype;
            if (!baseType && item.classList.contains('fakeItem')) {
                baseType = getBaseTypeFromItemType(itemType);
            }
            const newImageData = getColoredImageUrl(itemType, baseType);
            if (newImageData) {
                let styles = {};
                if (baseType === 'trousers') {
                    styles = { backgroundPositionY: '-37.5px' };
                } else if (baseType === 'coat') {
                    styles = { backgroundPositionY: '-17.5px', backgroundSize: '115%' };
                } else if (baseType === 'mask') {
                    styles = { backgroundPositionY: '-12.5px', backgroundSize: '250%' };
                } else if (baseType === 'hat') {
                    if (itemType.includes('bandana')) {
                        styles = { backgroundPositionY: '-17.5px', backgroundSize: '275%' };
                    } else {
                        styles = { backgroundPositionY: '-5px', backgroundSize: '250%' };
                    }
                } else if (baseType === 'shirt') {
                    styles = { backgroundPositionY: '-17.5px', backgroundSize: '135%' };
                } else if (baseType === 'armour') {
                    styles = { backgroundPositionY: '-15px', backgroundSize: '125%' };
                }
                applyImageWithFallback(item, newImageData, styles);
            }
            if (baseType === 'weapon') {
                item.style.backgroundSize = '150%';
                item.dataset.processed = 'true';
            }
        });
        updateSidebarArmour();
    }

    // Clears custom styles from tooltip.
    function clearCustomTooltipStyles(infoBox) {
        if (customStylesApplied) {
            infoBox.style.backgroundPositionX = '';
            infoBox.style.backgroundPositionY = '';
            infoBox.style.backgroundSize = '';
            customStylesApplied = false;
        }
    }

    // Updates tooltip with colored item image.
    function updateTooltipImages() {
        if (processingTooltip) return;
        processingTooltip = true;
        const infoBox = document.getElementById('infoBox');
        if (!infoBox) {
            processingTooltip = false;
            return;
        }
        const hoveredItem = document.querySelector('.item:hover, .fakeItem:hover');
        if (hoveredItem === lastHoveredItem) {
            processingTooltip = false;
            return;
        }
        lastHoveredItem = hoveredItem;
        if (!hoveredItem) {
            clearCustomTooltipStyles(infoBox);
            processingTooltip = false;
            return;
        }
        const itemType = hoveredItem.dataset.type || '';
        let baseType = hoveredItem.dataset.itemtype;
        if (!baseType && hoveredItem.classList.contains('fakeItem')) {
            baseType = getBaseTypeFromItemType(itemType);
        }
        const newImageData = getColoredImageUrl(itemType, baseType);
        if (newImageData) {
            customStylesApplied = true;
            let styles = {};
            if (baseType === 'trousers') {
                styles = { backgroundPositionX: '225px', backgroundPositionY: '-75px', backgroundSize: '25%' };
            } else if (baseType === 'coat') {
                styles = { backgroundPositionY: '-27.5px', backgroundSize: '32.5%' };
            } else if (baseType === 'hat') {
                if (itemType.includes('bandana')) {
                    styles = { backgroundPositionY: '9.5px', backgroundSize: '31.25%' };
                } else {
                    styles = { backgroundPositionY: '0px', backgroundSize: '25%' };
                }
            } else if (baseType === 'shirt') {
                styles = { backgroundPositionX: '200px', backgroundPositionY: '-37.5px', backgroundSize: '40%' };
            } else if (baseType === 'armour') {
                styles = { backgroundPositionX: '172.5px', backgroundPositionY: '-40px', backgroundSize: '50%' };
            } else if (baseType === 'mask') {
                styles = { backgroundPositionX: '175px', backgroundPositionY: '-5px', backgroundSize: '60%' };
            }
            applyImageWithFallback(infoBox, newImageData, styles);
        } else {
            clearCustomTooltipStyles(infoBox);
        }
        processingTooltip = false;
    }

    // Throttles tooltip updates.
    let tooltipTimeout;
    function throttledTooltipUpdate() {
        if (tooltipTimeout) return;
        tooltipTimeout = setTimeout(() => {
            updateTooltipImages();
            tooltipTimeout = null;
        }, 16);
    }

    // Observes DOM changes to update images.
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        let sidebarAdded = false;
        let armorSlotAdded = false;
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('item') || node.classList?.contains('fakeItem') || node.querySelector?.('.item') || node.querySelector?.('.fakeItem')) {
                            shouldUpdate = true;
                        }
                        if (node.id === 'sidebarArmour') {
                            sidebarAdded = true;
                        }
                        if (node.matches?.('[data-slottype="armour"]') || node.querySelector?.('[data-slottype="armour"]')) {
                            armorSlotAdded = true;
                        }
                    }
                });
            }
        });
        if (shouldUpdate) updateItemImages();
        if (sidebarAdded || armorSlotAdded) setupSidebarContainerObserver();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Listens for mouse events to update tooltips.
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.item') || e.target.closest('.fakeItem')) {
            throttledTooltipUpdate();
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('.item') || e.target.closest('.fakeItem')) {
            lastHoveredItem = null;
            throttledTooltipUpdate();
        }
    });

    // Initializes on page load.
    window.addEventListener('load', () => {
        updateItemImages();
        updateTooltipImages();
        setupSidebarContainerObserver();
    });
})();