// ==UserScript==
// @name         Dead Frontier - Cheapest
// @namespace    DF3D
// @version      3.1
// @description  Automatically logs scrap prices of all inventory items (direct computation, no hover needed) and highlights the cheapest item(s) with a yellow glow. Drag items to ignore zone to exclude from cheapest calculation.
// @match        https://fairview.deadfrontier.com/onlinezombiemmo/DF3D/DF3D_InventoryPage.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=deadfrontier.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const itemInfo = new Map();
    const IGNORED_ITEMS_KEY = 'df_ignored_cheapest_items';
    const ignoredItems = new Set(JSON.parse(localStorage.getItem(IGNORED_ITEMS_KEY) || '[]'));
    const itemTooltipNames = new Map();
    let textSpan = null;

    // Extracts item info
    function getItemInfoFromElement(itemElem) {
        const type = itemElem.dataset.type;
        if (!type) return null;
        const qty = parseInt(itemElem.dataset.quantity || '1', 10);
        const price = window.scrapValue(type, 1);
        if (isNaN(price) || price <= 0) return null;
        const globalData = window.globalData || {};
        const lowerType = type.toLowerCase();
        const name = globalData[lowerType]?.name || type;
        return { type, name, price };
    }

    // Saves ignored items to Storage
    function saveIgnoredItems() {
        localStorage.setItem(IGNORED_ITEMS_KEY, JSON.stringify([...ignoredItems]));
        updateIgnoreTooltip();
    }

    // Updates the tooltip title with ignored item names
    function updateIgnoreTooltip() {
        if (textSpan && itemInfo.size > 0) {
            const ignoredNames = [...ignoredItems]
                .map(type => {
                    const info = itemInfo.get(type);
                    return info ? info.name : type;
                })
                .filter(name => name && name !== type) // Avoid duplicates if name === type
                .join(', ');
            textSpan.title = ignoredItems.size > 0 ? `Ignored items: ${ignoredNames}` : 'No items ignored';
        } else if (textSpan) {
            // Fallback if itemInfo not yet populated
            const ignoredTypes = [...ignoredItems].join(', ');
            textSpan.title = ignoredItems.size > 0 ? `Ignored items: ${ignoredTypes}` : 'No items ignored';
        }
    }

    // Shows ignore/un-ignore message
    function showIgnoreMessage(itemName, isIgnored) {
        const inventoryDiv = document.querySelector('.opElem[style*="bottom: 90px"]');
        if (!inventoryDiv) return;
        const messageNode = inventoryDiv.childNodes[0];
        const originalText = messageNode.textContent;
        const message = isIgnored ? `${itemName} ignored` : `${itemName} un-ignored`;
        messageNode.textContent = message;
        setTimeout(() => {
            messageNode.textContent = originalText;
        }, 2000);
    }

    // Highlights cheapest items
    function highlightCheapest() {
        const items = document.querySelectorAll('#inventory .item');
        items.forEach(item => { item.style.boxShadow = ''; });
        if (itemInfo.size === 0) return;

        // Get non-ignored items
        const nonIgnoredItems = Array.from(itemInfo.entries())
            .filter(([type]) => !ignoredItems.has(type));
        if (nonIgnoredItems.length === 0) return;
        const minPrice = Math.min(...nonIgnoredItems.map(([_, info]) => info.price));
        const cheapest = nonIgnoredItems
            .filter(([_, info]) => info.price === minPrice)
            .map(([type]) => type);
        items.forEach(item => {
            const type = item.dataset.type;
            if (type && cheapest.includes(type)) {
                item.style.boxShadow = '0 0 8px 1px yellow';
            }
        });
    }

    // Scans inventory for item info
    function scanInventory() {
        const items = document.querySelectorAll('#inventory .item');
        if (items.length === 0) {
            return;
        }
        itemInfo.clear();
        const newTypes = new Set();
        let addedCount = 0;
        for (const item of items) {
            const data = getItemInfoFromElement(item);
            if (data) {
                itemInfo.set(data.type, { name: data.name, price: data.price });
                newTypes.add(data.type);
                addedCount++;
            }
        }
        if (addedCount > 0) {
            highlightCheapest();
            updateIgnoreTooltip();
        }
    }

    // Makes inventory items draggable for drag-and-drop ignore
    function makeItemsDraggable() {
        document.querySelectorAll('#inventory .item').forEach(item => {
            if (!item.getAttribute('draggable')) {
                item.setAttribute('draggable', 'true');
            }
        });
    }

    // Modifies inventory label to indicate drop location
    function modifyInventoryLabel() {
        const inventoryLabel = document.querySelector('.opElem[style*="bottom: 90px"]');
        if (inventoryLabel && inventoryLabel.childNodes[0]) {
            inventoryLabel.childNodes[0].textContent = 'Drop item here to Ignore from Cheapest';
            inventoryLabel.style.cursor = 'pointer';
        }
    }

    // Sets up drag-and-drop functionality
    function setupDragAndDrop() {
        let mouseDownItem = null;
        let isDragging = false;
        let dragStartPos = null;
        const ignoreZone = document.querySelector('.opElem[style*="bottom: 90px"]');
        const style = document.createElement('style');
        style.textContent = `
            .df-ignore-text {
                display: inline-block;
                position: relative;
                padding: 4px 10px;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            .df-ignore-text.dragover {
                background-color: rgba(255, 0, 0, 0.2);
                box-shadow: 0 0 15px 3px rgba(255, 0, 0, 0.6);
                color: #ff6666 !important;
            }
        `;
        document.head.appendChild(style);

        if (ignoreZone) {
            const labelNode = ignoreZone.childNodes[0];
            if (labelNode) {
                textSpan = document.createElement('span');
                textSpan.classList.add('df-ignore-text');
                textSpan.textContent = labelNode.textContent.trim();
                ignoreZone.replaceChild(textSpan, labelNode);
                updateIgnoreTooltip();
            }
        }

        // Add red glow to ignored items on hover over ignore zone
        if (textSpan) {
            textSpan.addEventListener('mouseenter', () => {
                const items = document.querySelectorAll('#inventory .item');
                items.forEach(item => { item.style.boxShadow = ''; });
                items.forEach(item => {
                    const type = item.dataset.type;
                    if (type && ignoredItems.has(type)) {
                        item.style.boxShadow = '0 0 8px 1px red';
                    }
                });
            });
            textSpan.addEventListener('mouseleave', () => {
                highlightCheapest();
            });
        }

        // Mouseover to capture tooltip names
        document.addEventListener('mouseover', e => {
            const itemDiv = e.target.closest('.item');
            if (itemDiv && !itemTooltipNames.has(itemDiv.getAttribute('data-type'))) {
                const dataType = itemDiv.getAttribute('data-type');
                setTimeout(() => {
                    const infoBox = document.getElementById('infoBox');
                    if (infoBox?.style.visibility === 'visible') {
                        const nameEl = infoBox.querySelector('.itemName');
                        if (nameEl && nameEl.textContent.trim()) {
                            itemTooltipNames.set(dataType, nameEl.textContent.trim());
                        }
                    }
                }, 100);
            }
        }, true);

        // Mousedown to start drag
        document.addEventListener('mousedown', e => {
            const itemDiv = e.target.closest('#inventory .item');
            if (itemDiv) {
                const dataType = itemDiv.getAttribute('data-type');
                const info = getItemInfoFromElement(itemDiv);
                mouseDownItem = {
                    type: dataType,
                    tooltipName: itemTooltipNames.get(dataType) || info?.name || dataType,
                    element: itemDiv
                };
                dragStartPos = { x: e.clientX, y: e.clientY };
                isDragging = false;
            }
        });

        // Mousemove to detect drag and update visual
        document.addEventListener('mousemove', e => {
            if (mouseDownItem && dragStartPos) {
                const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
                if (dist > 5) isDragging = true;
                if (isDragging && textSpan) {
                    const rect = textSpan.getBoundingClientRect();
                    const inside =
                        e.clientX >= rect.left &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.bottom;
                    textSpan.classList.toggle('dragover', inside);
                }
            }
        });

        // Mouseup to handle drop
        document.addEventListener('mouseup', e => {
            if (textSpan) textSpan.classList.remove('dragover');
            if (mouseDownItem && isDragging) {
                const under = document.elementFromPoint(e.clientX, e.clientY);
                const ignoreZoneUnder = under?.closest('.opElem[style*="bottom: 90px"]');
                if (ignoreZoneUnder && mouseDownItem.type) {
                    const itemType = mouseDownItem.type;
                    const itemName = mouseDownItem.tooltipName;
                    if (ignoredItems.has(itemType)) {
                        ignoredItems.delete(itemType);
                        showIgnoreMessage(itemName, false);
                    } else {
                        ignoredItems.add(itemType);
                        showIgnoreMessage(itemName, true);
                    }
                    saveIgnoredItems();
                    highlightCheapest();
                }
            }
            mouseDownItem = null;
            isDragging = false;
            dragStartPos = null;
        });
    }

    function setupListeners() {
        setTimeout(() => {
            modifyInventoryLabel();
            scanInventory();
            highlightCheapest();
            makeItemsDraggable();
        }, 1000);
    }

    // Observe inventory changes to update highlights.
    const inventoryTable = document.getElementById('inventory');
    if (inventoryTable) {
        const observer = new MutationObserver(() => {
            setTimeout(() => {
                makeItemsDraggable();
                scanInventory();
            }, 500);
        });
        observer.observe(inventoryTable, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-type', 'data-quantity'] });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupListeners);
    } else {
        setupListeners();
    }
    setupDragAndDrop();
})();