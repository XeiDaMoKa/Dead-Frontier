// ==UserScript==
// @name                        Dead Frontier - Layout
// @version                     1.00
// @description              Organizes Side bar, Adds icons to outpost and favorites.
// @author                      XeiDaMoKa [2373510]
// @source                      https://github.com/XeiDaMoKa/Dead-Frontier
// @downloadURL          https://github.com/XeiDaMoKa/Dead-Frontier/raw/main/Dead%20Frontier%20-%20Layouts.user.js
// @updateURL              https://github.com/XeiDaMoKa/Dead-Frontier/raw/main/Dead%20Frontier%20-%20Layouts.user.js
// @supportURL             https://fairview.deadfrontier.com/onlinezombiemmo/index.php?action=pm;sa=send
// @supportURL             https://github.com/XeiDaMoKa/Dead-Frontier/issues
// @match                       https://fairview.deadfrontier.com/*
// @icon                          https://www.google.com/s2/favicons?sz=64&domain=deadfrontier.com
// @grant                        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    // Applies Custom font , you can pick any font from Google fonts
    function addComfortaaFont() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700;900&display=swap');
            body, button, input, select, textarea, .text, .bigtext, .opElem, .menuLink, a {
                font-family: 'Comfortaa', sans-serif !important;
                font-weight: bold !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Removes the element with the link to (OA) Warning System and Help that doesnt work anymore without flash player.
    function removeOALinkTable() {
        const oaLinkTable = document.querySelector('table[width="550"][align="center"]');
        if (oaLinkTable) {
            const link = oaLinkTable.querySelector('a[onclick*="OA.php"]');
            if (link && link.textContent.includes('OA Warning System')) {
                oaLinkTable.remove();
                return true;
            }
        }
        return false;
    }

    // Replaces Messages button with an icon when 0 unread msg , and value with amount of unread msg.
    function getMessageEmoji(messageText) {
        const match = messageText.match(/Message \((\d+) New\)/);
        if (match) {
            const count = parseInt(match[1]);
            if (count === 0) {
                return '<img src="https://i.imgur.com/8bI7gYU.png" style="width: 18.5px; height: 18.5px; vertical-align: middle; filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 3px rgba(0, 0, 0, 1)); margin-top: 5px;">';
            }
            return `<span style="color: #bb0000; font-weight: bold; margin-top: 9px; display: inline-block;">${count}</span>`;
        }
        return '<img src="https://i.imgur.com/8bI7gYU.png" style="width: 18.5px; height: 18.5px; vertical-align: middle; filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 3px rgba(0, 0, 0, 1)); margin-top: 5px;">';
    }

    // Rearranges player info like username, cash, credits, and XP progress bar for a cleaner sidebar look.
    function adjustPlayerInfoPosition() {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        if (!sidebar) return;
        const playerInfoDivs = sidebar.querySelectorAll('div.opElem');
        for (const div of playerInfoDivs) {
            const cashSpan = div.querySelector('.heldCash');
            const creditsSpan = div.querySelector('.heldCredits');
            if (cashSpan && creditsSpan) {
                div.style.top = '25px';
                const usernameSpan = div.querySelector('span[style*="color: #ff0000"]');
                if (usernameSpan && !usernameSpan.parentElement.classList.contains('username-wrapper')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'username-wrapper';
                    wrapper.style.textAlign = 'left';
                    wrapper.style.width = '100%';
                    wrapper.style.paddingLeft = '5px';
                    wrapper.style.paddingTop = '6px';
                    usernameSpan.parentElement.insertBefore(wrapper, usernameSpan);
                    wrapper.appendChild(usernameSpan);
                    let nextElement = wrapper.nextSibling;
                    while (nextElement && nextElement.nodeName === 'BR') {
                        nextElement.remove();
                        nextElement = wrapper.nextSibling;
                    }
                    let remainingContent = wrapper.nextSibling;
                    if (remainingContent) {
                        const remainingDiv = document.createElement('div');
                        remainingDiv.className = 'player-info-remaining';
                        remainingDiv.style.marginTop = '5px';
                        remainingDiv.style.width = '100%';
                        remainingDiv.style.textAlign = 'right';
                        while (remainingContent) {
                            const next = remainingContent.nextSibling;
                            remainingDiv.appendChild(remainingContent);
                            remainingContent = next;
                        }
                        div.appendChild(remainingDiv);
                        const emptySpan = remainingDiv.querySelector('span[style*="color: #0066ff"]:empty');
                        if (emptySpan) {
                            emptySpan.remove();
                        }
                        const firstBr = remainingDiv.querySelector('br');
                        if (firstBr) {
                            firstBr.remove();
                        }
                    }
                } else if (usernameSpan && usernameSpan.parentElement.classList.contains('username-wrapper')) {
                    const wrapper = usernameSpan.parentElement;
                    wrapper.style.paddingTop = '10px';
                    let remainingDiv = div.querySelector('.player-info-remaining');
                    if (!remainingDiv) {
                        let remainingContent = wrapper.nextSibling;
                        if (remainingContent) {
                            remainingDiv = document.createElement('div');
                            remainingDiv.className = 'player-info-remaining';
                            remainingDiv.style.marginTop = '-5px';
                            remainingDiv.style.width = '100%';
                            remainingDiv.style.textAlign = 'right';
                            while (remainingContent) {
                                const next = remainingContent.nextSibling;
                                remainingDiv.appendChild(remainingContent);
                                remainingContent = next;
                            }
                            div.appendChild(remainingDiv);
                            const emptySpan = remainingDiv.querySelector('span[style*="color: #0066ff"]:empty');
                            if (emptySpan) {
                                emptySpan.remove();
                            }
                            const firstBr = remainingDiv.querySelector('br');
                            if (firstBr) {
                                firstBr.remove();
                            }
                        }
                    } else {
                        remainingDiv.style.marginTop = '-5px';
                        remainingDiv.style.textAlign = 'right';
                        const emptySpan = remainingDiv.querySelector('span[style*="color: #0066ff"]:empty');
                        if (emptySpan) {
                            emptySpan.remove();
                        }
                        const firstBr = remainingDiv.querySelector('br');
                        if (firstBr) {
                            firstBr.remove();
                        }
                    }
                }
                if (usernameSpan) {
                    usernameSpan.style.fontSize = '12.5px';
                }
                const spans = div.querySelectorAll('span[style*="color: #cccccc"]');
                spans.forEach(span => {
                    const text = span.textContent.trim();
                    const expMatch = text.match(/^([\d,]+)\s*\/\s*([\d,]+)$/);
                    if (expMatch) {
                        const current = parseInt(expMatch[1].replace(/,/g, ''));
                        const total = parseInt(expMatch[2].replace(/,/g, ''));
                        const percentage = Math.round((current / total) * 100);
                        // Calculate XP progress color gradient from red to green
                        let percentageNumberColor;
                        if (percentage <= 50) {
                            const red = 255;
                            const green = Math.round(255 * (percentage / 50));
                            percentageNumberColor = `rgb(${red},${green},0)`;
                        } else {
                            const red = Math.round(255 * ((100 - percentage) / 50));
                            const green = 255;
                            percentageNumberColor = `rgb(${red},${green},0)`;
                        }
                        const blueColor = '#417f91';
                        const currentFormatted = expMatch[1];
                        const totalFormatted = expMatch[2];
                        const newTextContent = `<span style="color: ${blueColor};">(<span style="color: ${percentageNumberColor};"><b>${percentage}%</b></span>) <span style="color: ${blueColor};"><b>${currentFormatted}</b> / <b>${totalFormatted}</b></span>`;
                        if (span.innerHTML !== newTextContent) {
                            span.innerHTML = newTextContent;
                        }
                    }
                    span.style.fontSize = '11px';
                });
                if (cashSpan) {
                    cashSpan.style.fontSize = '11px';
                }
                if (creditsSpan) {
                    creditsSpan.style.fontSize = '11px';
                }
                break;
            }
        }
    }

    // Gets position of outpost buttons.
    function getButtonPosition(button) {
        const parentDiv = button.parentElement;
        if (!parentDiv) return { top: 0, left: 0 };
        const top = parseInt(parentDiv.style.top) || 0;
        const left = parseInt(parentDiv.style.left) ||
            0;
        return { top, left };
    }

    // Sets new position for outpost buttons.
    function setButtonPosition(button, top, left) {
        const parentDiv = button.parentElement;
        if (parentDiv) {
            parentDiv.style.top = top + 'px';
            parentDiv.style.left = left + 'px';
        }
    }

    // Checks if two buttons are too close together.
    function areButtonsTooClose(pos1, pos2, minDistance = 60) {
        const distance = Math.sqrt(Math.pow(pos1.left - pos2.left, 2) + Math.pow(pos1.top - pos2.top, 2));
        return distance < minDistance;
    }

    // Adjusts spacing between outpost buttons to prevent overlap.
    function adjustButtonSpacing(buttons) {
        const positions = [];
        const adjustmentStep = 15;
        const maxIterations = 50;
        buttons.forEach(button => {
            const pos = getButtonPosition(button);
            positions.push({ button, ...pos });
        });
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let adjustmentMade = false;
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    if (areButtonsTooClose(positions[i], positions[j])) {
                        const dx = positions[j].left - positions[i].left;
                        const dy = positions[j].top - positions[i].top;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        let separationX, separationY;
                        if (distance === 0) {
                            separationX = (Math.random() - 0.5) * adjustmentStep * 2;
                            separationY = (Math.random() - 0.5) * adjustmentStep * 2;
                        } else {
                            separationX = (dx / distance) * adjustmentStep;
                            separationY = (dy / distance) * adjustmentStep;
                        }
                        positions[i].left -= separationX / 2;
                        positions[i].top -= separationY / 2;
                        positions[j].left += separationX / 2;
                        positions[j].top += separationY / 2;
                        adjustmentMade = true;
                    }
                }
            }
            if (!adjustmentMade) break;
        }
        positions.forEach(({ button, top, left }) => {
            setButtonPosition(button, Math.round(top), Math.round(left));
        });
    }

    // Counts equipped weapons in sidebar to adjust layouts.
    function getWeaponCount() {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        if (!sidebar) return 0;
        const weaponDivs = sidebar.querySelectorAll('div.opElem.weapon');
        let weaponsWithImages = 0;
        weaponDivs.forEach(div => {
            const img = div.querySelector('img');
            if (img && img.src && !img.src.includes('weaponholder.png')) {
                weaponsWithImages++;
            }
        });
        return weaponsWithImages;
    }

    // Adds small value showing how much more points to full (Food, health and armour).
    function addDifferenceSpan(current, total, textColor) {
        const diff = total - current;
        if (diff <= 0) return null;
        const diffSpan = document.createElement('span');
        diffSpan.textContent = diff;
        diffSpan.style.fontSize = '10px';
        diffSpan.style.fontWeight = 'bold';
        diffSpan.style.color = textColor;
        diffSpan.style.textAlign = 'center';
        diffSpan.style.display = 'block';
        diffSpan.style.marginTop = '2px';
        return diffSpan;
    }

    // Centers armor icon and status, glows green if full, adjusts position based on weapons.
    function fixArmourLayout(weaponCount) {
        const armourDiv = document.querySelector('#sidebarArmour');
        if (!armourDiv) return;
        const img = armourDiv.querySelector('img');
        const statusDiv = armourDiv.querySelector('div.opElem');
        if (img && statusDiv) {
            armourDiv.style.display = 'flex';
            armourDiv.style.flexDirection = 'column';
            armourDiv.style.alignItems = 'center';
            armourDiv.style.textAlign = 'center';
            armourDiv.style.left = '95px';
            armourDiv.style.width = '100px';
            let imgTop = 1;
            let textTop = 0;
            if (weaponCount <= 1) {
                imgTop = 40;
                textTop = 39;
            } else if (weaponCount === 2) {
                imgTop = 16;
                textTop = 17;
            }
            imgTop += 5;
            imgTop -= 3;
            img.style.position = 'relative';
            img.style.top = imgTop + 'px';
            img.style.marginBottom = '0px';
            statusDiv.style.position = 'relative';
            statusDiv.style.top = textTop + 'px';
            statusDiv.style.left = '0px';
            statusDiv.style.marginBottom = '5px';
            const armourHtml = statusDiv.innerHTML;
            if (armourHtml.includes('<br>')) {
                const parts = armourHtml.split('<br>');
                if (parts.length >= 2) {
                    const middle = parts[1].trim();
                    if (middle && middle.includes('/')) {
                        const match = middle.match(/^(\d+)\s*\/\s*(\d+)$/);
                        if (match) {
                            const current = parseInt(match[1]);
                            const total = parseInt(match[2]);
                            if (current === total) {
                                statusDiv.innerHTML = '';
                                statusDiv.style.display = 'none';
                                img.style.filter = 'drop-shadow(0 0 3px #12ff00)';
                            } else {
                                statusDiv.innerHTML = middle;
                                statusDiv.style.display = '';
                                img.style.filter = '';
                                const textColor = getComputedStyle(statusDiv).color;
                                const diffSpan = addDifferenceSpan(current, total, textColor);
                                if (diffSpan) {
                                    statusDiv.appendChild(diffSpan);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Centers health heart icon and status, glows green if full, adjusts based on weapons.
    function fixHealthLayout(weaponCount) {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        if (!sidebar) return;
        const healthDivs = sidebar.querySelectorAll('div.opElem');
        for (const div of healthDivs) {
            const heartImg = div.querySelector('img[src*="heart.png"]');
            const healthSpan = div.querySelector('.playerHealth');
            if (heartImg && healthSpan) {
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.alignItems = 'center';
                div.style.textAlign = 'center';
                div.style.width = '100px';
                div.style.height = '60px';
                div.style.overflow = 'visible';
                let imgTopOffset = -25;
                let textTopOffset = 10;
                if (weaponCount <= 1) {
                    imgTopOffset = 12.5;
                    textTopOffset = 50;
                } else if (weaponCount === 2) {
                    imgTopOffset = -7;
                    textTopOffset = 31;
                }
                heartImg.style.position = 'absolute';
                heartImg.style.top = imgTopOffset + 'px';
                heartImg.style.left = 'calc(50% + 13px)';
                heartImg.style.transform = 'translateX(-50%)';
                heartImg.style.zIndex = '10';
                healthSpan.style.position = 'absolute';
                healthSpan.style.top = textTopOffset + 'px';
                healthSpan.style.left = 'calc(50% + 13px)';
                healthSpan.style.transform = 'translateX(-50%)';
                healthSpan.style.width = '65px';
                healthSpan.style.marginBottom = '5px';
                const healthHtml = healthSpan.innerHTML;
                if (healthHtml.includes('<br>')) {
                    const parts = healthHtml.split('<br>');
                    if (parts.length >= 2) {
                        const middle = parts[1].trim();
                        if (middle && middle.includes('/')) {
                            const match = middle.match(/^(\d+)\s*\/\s*(\d+)$/);
                            if (match) {
                                const current = parseInt(match[1]);
                                const total = parseInt(match[2]);
                            if (current === total) {
                                healthSpan.innerHTML = '';
                                healthSpan.style.display = 'none';
                                heartImg.style.filter = 'drop-shadow(0 0 3px #12ff00)';
                            } else {
                                healthSpan.innerHTML = middle;
                                healthSpan.style.display = '';
                                heartImg.style.filter = '';
                                const textColor = getComputedStyle(healthSpan).color;
                                const diffSpan = addDifferenceSpan(current, total, textColor);
                                if (diffSpan) {
                                    healthSpan.appendChild(diffSpan);
                                }
                            }
                        }
                        }
                    }
                }
                break;
            }
        }
    }

    // Centers nourishment icon and status, glows green if full, adjusts based on weapons.
    function fixNourishmentLayout(weaponCount) {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        if (!sidebar) return;
        const nourishmentDivs = sidebar.querySelectorAll('div.opElem');
        for (const div of nourishmentDivs) {
            const nourishImg = div.querySelector('img[src*="yummytummy.png"]');
            const nourishSpan = div.querySelector('.playerNourishment');
            if (nourishImg && nourishSpan) {
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.alignItems = 'center';
                div.style.textAlign = 'center';
                div.style.width = '100px';
                div.style.height = '60px';
                div.style.overflow = 'visible';
                let imgTopOffset = -50;
                let textTopOffset = -15;
                if (weaponCount <= 1) {
                    imgTopOffset = -10;
                    textTopOffset = 25;
                } else if (weaponCount === 2) {
                    imgTopOffset = -27;
                    textTopOffset = 11;
                }
                nourishImg.style.position = 'absolute';
                nourishImg.style.top = imgTopOffset + 'px';
                nourishImg.style.left = 'calc(50% + 13px)';
                nourishImg.style.transform = 'translateX(-50%)';
                nourishImg.style.zIndex = '10';
                nourishSpan.style.position = 'absolute';
                nourishSpan.style.top = textTopOffset + 'px';
                nourishSpan.style.left = 'calc(50% + 13px)';
                nourishSpan.style.transform = 'translateX(-50%)';
                nourishSpan.style.width = '65px';
                nourishSpan.style.marginBottom = '5px';
                const nourishHtml = nourishSpan.innerHTML;
                if (nourishHtml.includes('<br>')) {
                    const parts = nourishHtml.split('<br>');
                    if (parts.length >= 2) {
                        const middle = parts[1].trim();
                        if (middle && middle.includes('/')) {
                            const match = middle.match(/^(\d+)\s*\/\s*(\d+)$/);
                            if (match) {
                                const current = parseInt(match[1]);
                                const total = parseInt(match[2]);
                            if (current === total) {
                                nourishSpan.innerHTML = '';
                                nourishSpan.style.display = 'none';
                                nourishImg.style.filter = 'drop-shadow(0 0 3px #12ff00)';
                            } else {
                                nourishSpan.innerHTML = middle;
                                nourishSpan.style.display = '';
                                nourishImg.style.filter = '';
                                const textColor = getComputedStyle(nourishSpan).color;
                                const diffSpan = addDifferenceSpan(current, total, textColor);
                                if (diffSpan) {
                                    nourishSpan.appendChild(diffSpan);
                                }
                            }
                        }
                        }
                    }
                }
                break;
            }
        }
    }

    // Stacks weapons vertically in sidebar, moves empty slot above them.
    function fixWeaponLayout() {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        if (!sidebar) return;
        const weaponDivs = sidebar.querySelectorAll('div.opElem.weapon');
        const weaponHolder = sidebar.querySelector('img[src*="weaponholder.png"]');
        if (!weaponHolder && weaponDivs.length === 0) return;
        let weaponsWithImages = 0;
        const actualWeaponElements = [];
        weaponDivs.forEach(div => {
            const img = div.querySelector('img');
            if (img && img.src && !img.src.includes('weaponholder.png')) {
                weaponsWithImages++;
                actualWeaponElements.push(div);
            }
        });
        const defaultWeaponTops = [
            '373px',
            '426px',
            '479px'
        ];
        if (weaponsWithImages === 0 || weaponsWithImages === 1) {
            if (weaponHolder) weaponHolder.style.top = '425px';
            if (actualWeaponElements[0]) {
                actualWeaponElements[0].style.top = (425 + 40) + 'px';
            }
            weaponDivs.forEach(element => {
                if (!actualWeaponElements.includes(element)) {
                    element.style.top = '';
                }
            });
        } else if (weaponsWithImages === 2) {
            if (weaponHolder) weaponHolder.style.top = '375px';
            if (actualWeaponElements[0]) {
                actualWeaponElements[0].style.top = (375 + 40) + 'px';
            }
            if (actualWeaponElements[1]) {
                actualWeaponElements[1].style.top = (375 + 40 + 53) + 'px';
            }
        } else if (weaponsWithImages >= 3) {
            if (weaponHolder) weaponHolder.style.top = '343px';
            actualWeaponElements.forEach((element, index) => {
                if (defaultWeaponTops[index]) {
                    element.style.top = defaultWeaponTops[index];
                } else {
                    element.style.top = '';
                }
            });
        }
    }

    // Moves boosts info above weapons in sidebar.
    function fixBoostsLayout() {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        const boostsDiv = sidebar ? sidebar.querySelector('.opElem.boostTimes') : null;
        if (!boostsDiv) return;
        const weaponHolder = sidebar.querySelector('img[src*="weaponholder.png"]');
        if (!weaponHolder || !weaponHolder.style.top) {
            return;
        }
        const weaponHolderTop = parseInt(weaponHolder.style.top, 10);
        const boostsDivHeight = boostsDiv.offsetHeight;
        const newTop = weaponHolderTop - boostsDivHeight - 5;
        boostsDiv.style.top = `${newTop}px`;
        boostsDiv.style.left = '0px';
        boostsDiv.style.width = '100%';
        boostsDiv.style.textAlign = 'left';
        boostsDiv.style.paddingLeft = '5px';
    }

    // Adds boss map toggle at the top of every page
    function addBossMap() {
        if (document.getElementById('boss-map-toggle')) return; // Already added

        // Create toggle bar at the top, always visible
        const toggleBar = document.createElement('div');
        toggleBar.id = 'boss-map-toggle';
        toggleBar.style.position = 'fixed';
        toggleBar.style.top = '0';
        toggleBar.style.left = '0';
        toggleBar.style.width = '100%';
        toggleBar.style.height = '20px';
        toggleBar.style.backgroundColor = '#000';
        toggleBar.style.color = '#ff0000';
        toggleBar.style.textAlign = 'center';
        toggleBar.style.lineHeight = '20px';
        toggleBar.style.cursor = 'pointer';
        toggleBar.style.fontSize = '11px';
        toggleBar.style.fontWeight = 'bold';
        toggleBar.style.borderBottom = '1px solid #333';
        toggleBar.style.zIndex = '10000';
        toggleBar.textContent = 'Show Boss Map';

        // Create full-width boss map container below the toggle
        const bossMapWrapper = document.createElement('div');
        bossMapWrapper.id = 'boss-map-wrapper';
        bossMapWrapper.style.position = 'fixed';
        bossMapWrapper.style.top = '15px'; // Below toggle bar
        bossMapWrapper.style.left = '0';
        bossMapWrapper.style.width = '100%';
        bossMapWrapper.style.height = 'calc(100vh - 15px)'; // Full viewport height minus toggle
        bossMapWrapper.style.zIndex = '9999';
        bossMapWrapper.style.backgroundColor = '#000';
        bossMapWrapper.style.display = 'none'; // Start hidden

        const bossMapContainer = document.createElement('div');
        bossMapContainer.className = 'boss-map-container';
        bossMapContainer.style.width = '100%';
        bossMapContainer.style.height = '100%';
        bossMapContainer.style.overflow = 'hidden';
        bossMapContainer.innerHTML = `
            <iframe src="https://www.dfprofiler.com/bossmap"
                    width="100%"
                    height="100%"
                    frameborder="0"
                    sandbox="allow-scripts allow-same-origin"
                    style="border: none; display: block; width: 100%; height: 100%;">
            </iframe>
        `;

        bossMapWrapper.appendChild(bossMapContainer);

        // Toggle functionality
        let mapVisible = false;
        toggleBar.addEventListener('click', function() {
            mapVisible = !mapVisible;
            if (mapVisible) {
                bossMapWrapper.style.display = 'block';
                toggleBar.textContent = 'Hide Boss Map';
            } else {
                bossMapWrapper.style.display = 'none';
                toggleBar.textContent = 'Show Boss Map';
            }
        });

        // Insert toggle bar and map wrapper at the beginning of body
        document.body.insertBefore(toggleBar, document.body.firstChild);
        document.body.insertBefore(bossMapWrapper, document.body.firstChild);

        // Try to hide navigation/header inside iframe after load
        const iframe = bossMapContainer.querySelector('iframe');
        iframe.addEventListener('load', function() {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                // Hide common navigation elements
                const style = iframeDoc.createElement('style');
                style.textContent = `
                    header, nav, .header, .navigation, .navbar, .menu, footer, .footer {
                        display: none !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                `;
                iframeDoc.head.appendChild(style);
            } catch (e) {

            }
        });
    }

    // Embeds outpost attack warning in footer, checks for attacks every minute with siren alert.
    function addOASystem() {
        const targetTd = document.querySelector('td.design2010[width="275"][align="center"][valign="bottom"]');
        if (!targetTd || targetTd.querySelector('.oa-container')) return;

        const font = targetTd.querySelector('font');
        if (!font) return;

        const oaContainer = document.createElement('div');
        oaContainer.className = 'oa-container';
        oaContainer.style.marginBottom = '10px';
        oaContainer.style.overflow = 'visible';
        // Make OA warning smaller: scale down image sizes by ~50%
        oaContainer.innerHTML = `
            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tbody>
                    <tr>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_0_0.jpg" style="width: 52px; height: 32px; border-width: 0px; padding:0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_0_1.jpg" style="width: 53px; height: 32px; border-width: 0px; padding:0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_0_2.jpg" style="width: 53px; height: 32px; border-width: 0px; padding:0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_0_3.jpg" style="width: 232px; height: 32px; border-width: 0px; padding:0px;"></td>
                    </tr>
                    <tr>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_1_0.jpg" style="width: 52px; height: 30px; border-width: 0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_1_1.jpg" style="width: 53px; height: 30px; border-width: 0px;"></td>
                        <td id="nastyasHoldout" style="background-image:url('https://deadfrontier.com/OACheckImages/off_1_2.jpg');width: 53px; height: 30px; border-width: 0px;padding:0px;"><p style="padding:0; color: #000000; font-size: 7.5px; margin: -10.25px 0 0 0; font-family: 'Comfortaa', sans-serif !important; font-weight: 900; text-shadow: 1px 1px 1px rgba(255,255,255,0.5); text-align: center;"><br>Nastya's<br>Holdout</p></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_1_3.jpg" style="width: 232px; height: 30px; border-width: 0px;"></td>
                    </tr>
                    <tr>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_2_0.jpg" style="width: 52px; height: 29.5px; border-width: 0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_2_1.jpg" style="width: 53px; height: 29.5px; border-width: 0px;"></td>
                        <td id="doggsStockade" style="background-image:url('https://deadfrontier.com/OACheckImages/off_2_2.jpg');width: 53px; height: 29.5px; border-width: 0px;"><p style="padding:0; color: #000000; font-size: 7.5px; margin: -10.25px 0 0 0; font-family: 'Comfortaa', sans-serif !important; font-weight: 900; text-shadow: 1px 1px 1px rgba(255,255,255,0.5); text-align: center;"><br>Dogg's<br>Stockade</p></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_2_3.jpg" style="width: 232px; height: 29.5px; border-width: 0px;"></td>
                    </tr>
                    <tr>
                        <td id="secronomBunker" style="background-image:url('https://deadfrontier.com/OACheckImages/off_3_0.jpg'); width: 52px; height: 28.5px; border-width: 0px;"><p style="padding:0; color: #000000; font-size: 7.5px; margin: -7.75px 0 0 0; font-family: 'Comfortaa', sans-serif !important; font-weight: 900; text-shadow: 1px 1px 1px rgba(255,255,255,0.5); text-align: center;"><br>Secronom<br>Bunker</p></td>
                        <td id="fortPastor" style="background-image:url('https://deadfrontier.com/OACheckImages/off_3_1.jpg'); width: 53px; height: 28.5px; border-width: 0px;"><p style="padding:0; color: #000000; font-size: 7.5px; margin: -7.75px 0 0 0; font-family: 'Comfortaa', sans-serif !important; font-weight: 900; text-shadow: 1px 1px 1px rgba(255,255,255,0.5); text-align: center;"><br>Fort<br>Pastor</p></td>
                        <td id="precinct13" style="background-image:url('https://deadfrontier.com/OACheckImages/off_3_2.jpg'); width: 53px; height: 28.5px; border-width: 0px;"><p style="padding:0; color: #000000; font-size: 7.5px; margin: -7.75px 0 0 0; font-family: 'Comfortaa', sans-serif !important; font-weight: 900; text-shadow: 1px 1px 1px rgba(255,255,255,0.5); text-align: center;"><br>Precinct<br>13</p></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_3_3.jpg" style="width: 232px; height: 28.5px; border-width: 0px;"></td>
                    </tr>
                    <tr>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_4_0.jpg" style="width: 52px; height: 15.5px; border-width: 0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_4_1.jpg" style="width: 53px; height: 15.5px; border-width: 0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_4_2.jpg" style="width: 53px; height: 15.5px; border-width: 0px;"></td>
                        <td><img alt=" " src="https://deadfrontier.com/OACheckImages/off_4_3.jpg" style="width: 232px; height: 15.5px; border-width: 0px;"></td>
                    </tr>
                </tbody>
            </table>
        `;
        targetTd.insertBefore(oaContainer, font);
        const audio = document.createElement('audio');
        audio.src = 'https://deadfrontier.com/siren.mp3';
        audio.id = 'oa-siren';
        audio.volume = 0.5;
        document.body.appendChild(audio);
        let last_attacks = [];
        function checkOA() {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://deadfrontier.com/OACheck.php',
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const resp = JSON.parse(response.responseText);
                            const attacks = resp;
                            let new_attack = false;
                            for (let i = 0; i < attacks.length; i++) {
                                if (last_attacks.indexOf(attacks[i]) === -1) {
                                    const elem = document.getElementById(attacks[i]);
                                    if (elem) {
                                        let currentBg = elem.style.backgroundImage;
                                        let newBg = currentBg.replace(/off_/, 'on_');
                                        elem.style.backgroundImage = newBg;
                                        new_attack = true;
                                    }
                                }
                            }
                            for (let i = 0; i < last_attacks.length; i++) {
                                if (attacks.indexOf(last_attacks[i]) === -1) {
                                    const elem = document.getElementById(last_attacks[i]);
                                    if (elem) {
                                        let currentBg = elem.style.backgroundImage;
                                        let newBg = currentBg.replace(/on_/, 'off_');
                                        elem.style.backgroundImage = newBg;
                                    }
                                }
                            }
                            last_attacks = attacks.slice(0);
                            if (new_attack) {
                                const siren = document.getElementById('oa-siren');
                                if (siren) {
                                    siren.play().catch(e => {});
                                }
                            }
                        } catch (e) {
                        }
                    }
                }
            });
        }
        checkOA();
        setInterval(checkOA, 60000);
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blinkWarning {
                0% { color: red; }
                100% { color: white; }
            }
            .blinkWarning {
                animation: blinkWarning 1s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }

    let favoriteEmojis = JSON.parse(localStorage.getItem('deadFrontierFavoriteEmojis')) || [];
    const MAX_FAVORITES = 5;

    // Saves favorites list to browser storage.
    function saveFavorites() {
        localStorage.setItem('deadFrontierFavoriteEmojis', JSON.stringify(favoriteEmojis));
    }

    // Adds a location to your favorites quick bar (up to 5).
    function addFavoriteEmoji(emoji, text, href) {
        let emojiKey = typeof emoji === 'string' ?
            emoji : emoji.alt ?
                `${emoji.alt.toLowerCase()}-image` : 'custom-image';
        if (!favoriteEmojis.some(fav => fav.href === href)) {
            if (favoriteEmojis.length >= MAX_FAVORITES) {
                return;
            }
            favoriteEmojis.push({ emoji: emojiKey, text, href });
            saveFavorites();
            renderFavoriteEmojiHolder();
        } else {
        }
    }

    // Removes a location from your favorites quick bar.
    function removeFavoriteEmoji(href) {
        favoriteEmojis = favoriteEmojis.filter(fav => fav.href !== href);
        saveFavorites();
        renderFavoriteEmojiHolder();
    }

    // Displays your favorites as icons in the main menu spot.
    function renderFavoriteEmojiHolder() {
        const targetTd = document.querySelector('td[width="163"][class="design2010"][background="https://files.deadfrontier.com/deadfrontier/DF3Dimages/mainpage/menu_div6.jpg"]');
        if (!targetTd) return false;
        if (window.getComputedStyle(targetTd).position === 'static') {
            targetTd.style.position = 'relative';
        }
        let favoriteHolder = targetTd.querySelector('.favorite-emoji-holder');
        if (!favoriteHolder) {
            favoriteHolder = document.createElement('div');
            favoriteHolder.className = 'favorite-emoji-holder';
            favoriteHolder.style.position = 'absolute';
            favoriteHolder.style.left = '0';
            favoriteHolder.style.right = '0';
            favoriteHolder.style.top = '45%';
            favoriteHolder.style.transform = 'translateY(-50%)';
            favoriteHolder.style.display = 'flex';
            favoriteHolder.style.flexDirection = 'row';
            favoriteHolder.style.justifyContent = 'space-around';
            favoriteHolder.style.alignItems = 'center';
            favoriteHolder.style.padding = '0 15px';
            favoriteHolder.style.gap = '8px';
            targetTd.appendChild(favoriteHolder);
        }
        favoriteHolder.innerHTML = '';
        if (favoriteEmojis.length === 0) {
            const placeholder = document.createElement('span');
            placeholder.textContent = 'Hold button to add ⭐';
            placeholder.style.fontSize = '12px';
            placeholder.style.fontWeight = 'bold';
            placeholder.style.color = 'red';
            placeholder.style.textShadow = `
                -2px -2px 0 #000,
                2px -2px 0 #000,
                -2px 2px 0 #000,
                2px 2px 0 #000
            `;
            favoriteHolder.appendChild(placeholder);
        } else {
            favoriteEmojis.forEach(fav => {
                const favLink = document.createElement('a');
                favLink.href = fav.href;
                favLink.innerHTML = '';
                const createFavImage = (src, alt, adjustLeft = false) => {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = alt;
                    img.style.width = '17.5px';
                    img.style.height = '17.5px';
                    img.style.display = 'block';
                    img.style.filter = 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 3px rgba(0, 0, 0, 1))';
                    img.style.transition = 'filter 0.2s ease';
                    if (adjustLeft) {
                        img.style.position = 'relative';
                        img.style.left = '-2px';
                    }
                    img.addEventListener('mouseenter', function() {
                        this.style.filter = 'drop-shadow(0 0 6px rgba(255, 0, 0, 0.8)) drop-shadow(0 0 3px rgba(255, 0, 0, 1))';
                    });
                    img.addEventListener('mouseleave', function() {
                        this.style.filter = 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 3px rgba(0, 0, 0, 1))';
                    });
                    return img;
                };
                if (fav.emoji === 'bank-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/4Hm6RuN.png', 'Bank'));
                } else if (fav.emoji === 'the-yard-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/Khkgire.png', 'The Yard'));
                } else if (fav.emoji === 'marketplace-image') {
                    const img = createFavImage('https://i.imgur.com/pSmrTcn.png', 'Marketplace', true);
                    img.style.width = '20px';
                    img.style.height = '20px';
                    favLink.appendChild(img);
                } else if (fav.emoji === 'storage-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/U0AEFBI.png', 'Storage'));
                } else if (fav.emoji === 'arena-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/NOJUKHp.png', 'Arena'));
                } else if (fav.emoji === 'crafting-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/6obmSgj.png', 'Crafting'));
                } else if (fav.emoji === 'meeting-hall-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/BV6jHSl.png', 'Meeting Hall'));
                } else if (fav.emoji === 'vendor-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/foFLMwv.png', 'Vendor'));
                } else if (fav.emoji === 'gambling-den-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/F8SQs8x.png', 'Gambling Den'));
                } else if (fav.emoji === 'records-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/F9Fpeu9.png', 'Records'));
                } else if (fav.emoji === 'clan-hq-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/5lLzdgI.png', 'Clan HQ'));
                } else if (fav.emoji === 'inner-city-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/tPNvJDc.png', 'Inner City'));
                } else if (fav.emoji === 'fast-travel-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/ZSS2KeQ.png', 'Fast Travel'));
                } else if (fav.emoji === 'arcade-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/2XAOc1G.png', 'Arcade'));
                } else if (fav.emoji === 'supply-officer-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/SB95QRo.png', 'Supply Officer'));
                } else if (fav.emoji === 'collection-book-image') {
                    favLink.appendChild(createFavImage('https://i.imgur.com/n6pVhqn.png', 'Collection Book'));
                }
                else {
                    favLink.textContent = fav.emoji;
                    favLink.style.fontSize = '15px';
                }
                favLink.title = fav.text;
                favLink.style.textDecoration = 'none';
                favLink.style.color = 'white';
                favLink.style.cursor = 'pointer';
                favLink.style.flexShrink = '0';
                let pressTimer;
                let isLongPress = false;
                let preventedDefaultClick = false;
                favLink.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    isLongPress = false;
                    preventedDefaultClick = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        removeFavoriteEmoji(fav.href);
                        preventedDefaultClick = true;
                    }, 1000);
                });
                favLink.addEventListener('mouseup', () => {
                    clearTimeout(pressTimer);
                });
                favLink.addEventListener('mouseleave', () => {
                    clearTimeout(pressTimer);
                });
                favLink.addEventListener('click', (e) => {
                    if (preventedDefaultClick) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                });
                favoriteHolder.appendChild(favLink);
            });
        }
        targetTd.dataset.emojiAdded = 'true';
        return true;
    }

    // Replaces outpost button text with icons, adds long-press to favorite, spaces buttons.
    function replaceOutpostButtonText() {
        const outpost = document.querySelector('#outpost');
        if (!outpost) return false;
        const buttons = outpost.querySelectorAll('button[data-page]');
        let replacementsMade = 0;
        const processedButtons = [];
        buttons.forEach((button) => {
            if (button.dataset.emojiProcessed === 'true' && button.querySelector('.button-emoji')) {
                return;
            }
            const currentText = button.textContent.trim();
            const normalizedText = currentText.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
            if (normalizedText.includes('Supply') || normalizedText.includes('Officer')) {
            }

            let emoji = null;
            let actualHref = '';
            const parentLink = button.closest('a');
            if (parentLink) {
                actualHref = parentLink.getAttribute('href') || '';
            }
            if (!actualHref && button.dataset.page) {
                actualHref = `index.php?page=${button.dataset.page}`;
            }
            const createButtonImage = (src, alt, adjustLeft = false) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = alt;
                img.style.width = '28px';
                img.style.height = '28px';
                img.style.display = 'block';
                img.style.filter = 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 4px rgba(0, 0, 0, 1))';
                if (adjustLeft) {
                    img.style.position = 'relative';
                    img.style.left = '-2px';
                }
                return img;
            };
            switch (normalizedText) {
                case 'Bank':
                    emoji = createButtonImage('https://i.imgur.com/4Hm6RuN.png', 'Bank');
                    emoji.style.width = '26px';
                    emoji.style.height = '26px';
                    break;
                case 'The Yard':
                    emoji = createButtonImage('https://i.imgur.com/Khkgire.png', 'The Yard');
                    break;
                case 'Marketplace':
                case 'Trading':
                    emoji = createButtonImage('https://i.imgur.com/pSmrTcn.png', 'Marketplace', true);
                    break;
                case 'Storage':
                    emoji = createButtonImage('https://i.imgur.com/U0AEFBI.png', 'Storage');
                    break;
                case 'Clan HQ':
                    emoji = createButtonImage('https://i.imgur.com/5lLzdgI.png', 'Clan HQ');
                    emoji.style.width = '32px';
                    emoji.style.height = '32px';
                    break;
                case 'Crafting':
                    emoji = createButtonImage('https://i.imgur.com/6obmSgj.png', 'Crafting');
                    break;
                case 'Records':
                    emoji = createButtonImage('https://i.imgur.com/F9Fpeu9.png', 'Records');
                    break;
                case 'Meeting Hall':
                    emoji = createButtonImage('https://i.imgur.com/BV6jHSl.png', 'Meeting Hall');
                    break;
                case 'Vendor':
                    emoji = createButtonImage('https://i.imgur.com/foFLMwv.png', 'Vendor');
                    break;
                case 'Gambling Den':
                    emoji = createButtonImage('https://i.imgur.com/F8SQs8x.png', 'Gambling Den');
                    break;
                case 'Fast Travel':
                    emoji = createButtonImage('https://i.imgur.com/ZSS2KeQ.png', 'Fast Travel');
                    break;
                case 'Arcade':
                    emoji = createButtonImage('https://i.imgur.com/2XAOc1G.png', 'Arcade');
                    break;
                case 'Supply Officer':
                    emoji = createButtonImage('https://i.imgur.com/SB95QRo.png', 'Supply Officer');
                    break;
                default:
                    if (normalizedText.includes('Inner City')) {
                        emoji = createButtonImage('https://i.imgur.com/68sN0bZ.png', 'Inner City');
                    } else if (normalizedText.includes('Arena')) {
                        emoji = createButtonImage('https://i.imgur.com/NOJUKHp.png', 'Arena');
                    } else if (normalizedText.includes('Supply') && normalizedText.includes('Officer')) {
                        emoji = createButtonImage('https://i.imgur.com/SB95QRo.png', 'Supply Officer');
                        emoji.style.width = '36px';
                        emoji.style.height = '36px';
                    } else if (button.dataset.page === '86') {
                        emoji = createButtonImage('https://i.imgur.com/SB95QRo.png', 'Supply Officer');
                    }
                    break;
            }
            if (emoji) {
                if (button.dataset.emojiProcessed !== 'true') {
                    button.innerHTML = '';
                }
                let emojiElement = button.querySelector('.button-emoji');
                let textWrapper = button.querySelector('.button-text');
                if (!emojiElement) {
                    emojiElement = document.createElement('div');
                    emojiElement.className = 'button-emoji';
                    button.prepend(emojiElement);
                }
                emojiElement.innerHTML = '';
                if (typeof emoji === 'string') {
                    emojiElement.textContent = emoji;
                    emojiElement.style.fontSize = '28px';
                } else {
                    emojiElement.appendChild(emoji);
                }
                emojiElement.style.lineHeight = '1';
                emojiElement.style.marginBottom = '2px';
                if (!textWrapper) {
                    textWrapper = document.createElement('div');
                    textWrapper.className = 'button-text';
                    button.appendChild(textWrapper);
                }
                textWrapper.textContent = normalizedText;
                if (normalizedText === 'SupplyOfficer') {
                    textWrapper.textContent = 'Supply Officer';
                }
                textWrapper.style.fontSize = '13px';
                textWrapper.style.lineHeight = '1';
                button.style.display = 'flex';
                button.style.flexDirection = 'column';
                button.style.alignItems = 'center';
                button.style.justifyContent = 'center';
                button.style.textAlign = 'center';
                button.style.padding = '8px';
                button.style.minHeight = '45px';
                button.dataset.emojiProcessed = 'true';
                processedButtons.push(button);
                replacementsMade++;
                let pressTimer;
                let isLongPress = false;
                let preventedDefaultClick = false;
                button.addEventListener('mousedown', (e) => {
                    isLongPress = false;
                    preventedDefaultClick = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        let favEmoji;
                        if (typeof emoji === 'string') {
                            favEmoji = emoji;
                        } else {
                            favEmoji = normalizedText.toLowerCase().replace(/\s/g, '-') + '-image';
                        }
                        if (favoriteEmojis.some(fav => fav.href === actualHref)) {
                            removeFavoriteEmoji(actualHref);
                        } else {
                            if (actualHref) {
                                addFavoriteEmoji(favEmoji, normalizedText, actualHref);
                            } else {
                            }
                        }
                        preventedDefaultClick = true;
                    }, 1000);
                });
                button.addEventListener('mouseup', () => {
                    clearTimeout(pressTimer);
                });
                button.addEventListener('mouseleave', () => {
                    clearTimeout(pressTimer);
                });
                if (parentLink) {
                    parentLink.addEventListener('click', (e) => {
                        if (preventedDefaultClick) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }
                    }, true);
                }
                button.addEventListener('click', (e) => {
                    if (preventedDefaultClick) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                    }
                });
            }
        });
        if (processedButtons.length > 1) {
            adjustButtonSpacing(processedButtons);
        }
        return replacementsMade > 0;
    }

// Adds long-press favorite option to Collection Book link with icon.
function processCollectionBook() {
    const collectionLinks = document.querySelectorAll('a.opElem');
    let processed = false;
    collectionLinks.forEach(link => {
        if (link.dataset.favProcessed === 'true') return;
        const href = link.getAttribute('href') || '';
        const text = link.textContent.trim();
        if (text.includes('Collection Book') && href.includes('page=82')) {
            const actualHref = href;
            const emojiKey = 'collection-book-image';
            // Create icon for Collection Book
            const img = document.createElement('img');
            img.src = 'https://i.imgur.com/n6pVhqn.png';
            img.alt = 'Collection Book';
            img.style.width = '17px';
            img.style.height = '17px';
            img.style.display = 'inline-block';
            img.style.verticalAlign = 'middle';
            img.style.marginRight = '5px';
            img.style.filter = 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 3px rgba(0, 0, 0, 1))';
            // Replace content with icon + text
            const originalText = link.textContent.trim();
            link.innerHTML = '';
            link.appendChild(img);
            link.appendChild(document.createTextNode(originalText));
            // Adjust link styles for better alignment
            link.style.fontSize = '16px';
            link.style.lineHeight = '1.2';
            let pressTimer;
            let isLongPress = false;
            let preventedDefaultClick = false;
            link.addEventListener('mousedown', (e) => {
                isLongPress = false;
                preventedDefaultClick = false;
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    if (favoriteEmojis.some(fav => fav.href === actualHref)) {
                        removeFavoriteEmoji(actualHref);
                    } else {
                        addFavoriteEmoji(emojiKey, text, actualHref);
                    }
                    preventedDefaultClick = true;
                }, 1000);
            });
            link.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
            });
            link.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
            });
            link.addEventListener('click', (e) => {
                if (preventedDefaultClick) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            });
            link.title = text + ' (Hold to add/remove from favorites)';
            link.dataset.favProcessed = 'true';
            processed = true;
        }
    });
    return processed;
}

    // Replaces sidebar menu links with icons, cleans up XP display.
    function replaceMenuText() {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        if (!sidebar) return false;
        adjustPlayerInfoPosition();
        let menuDiv = null;
        const menuDivs = sidebar.querySelectorAll('div.opElem');
        for (const div of menuDivs) {
            const inventoryLink = div.querySelector('a[href="index.php?page=25"]');
            if (inventoryLink) {
                menuDiv = div;
                break;
            }
        }
        if (!menuDiv) return false;
        if (!menuDiv.style.display || menuDiv.style.display !== 'flex') {
            menuDiv.style.display = 'flex';
            menuDiv.style.flexWrap = 'wrap';
            menuDiv.style.gap = '17.5px';
            menuDiv.style.alignItems = 'center';
            menuDiv.style.paddingLeft = '6px';
        }
        const links = menuDiv.querySelectorAll('a');
        let replacementsMade = 0;
        function createMenuImage(src, alt, isLarger = false) {
            const img = document.createElement('img');
            img.src = src;
            img.alt = alt;
            img.style.width = isLarger ? '19px' : '17px';
            img.style.height = isLarger ? '19px' : '17px';
            img.style.display = 'block';
            img.style.filter = 'drop-shadow(0 0 6px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 3px rgba(0, 0, 0, 1))';
            img.style.marginTop = '5px';
            return img;
        }
        links.forEach((link) => {
            const href = link.getAttribute('href');
            const currentText = link.textContent.trim();
            let newContent = null;
            let isImage = false;
            link.style.fontSize = '19px';
            link.style.textDecoration = 'none';
            link.style.display = 'inline-block';
            link.style.textShadow = 'none';
            if (href === 'index.php?page=25' && currentText.includes('Inventory')) {
                newContent = createMenuImage('https://i.imgur.com/xaw2Zqe.png', 'Inventory');
                isImage = true;
            } else if (href === 'index.php?action=pm' && currentText.includes('Message')) {
                newContent = getMessageEmoji(currentText);
                isImage = false;
            } else if (href === 'index.php?action=profile' && currentText.includes('Profile')) {
                newContent = createMenuImage('https://i.imgur.com/uSNQarU.png', 'Profile', true);
                isImage = true;
            } else if (href === 'index.php?page=62' && currentText.includes('Challenges')) {
                newContent = createMenuImage('https://i.imgur.com/6qNb4bM.png', 'Challenges');
                isImage = true;
            } else if (href === 'index.php?page=81' && currentText.includes('Masteries')) {
                newContent = createMenuImage('https://i.imgur.com/58PodWi.png', 'Masteries', true);
                isImage = true;
            }
            if (newContent) {
                const hasChanged = isImage ?
                    !link.querySelector('img') || link.querySelector('img')?.src !== newContent.src :
                    link.innerHTML !== newContent;
                if (hasChanged) {
                    if (isImage) {
                        link.innerHTML = '';
                        link.appendChild(newContent);
                    } else {
                        link.innerHTML = newContent;
                    }
                    replacementsMade++;
                }
            }
        });
        const brTags = menuDiv.querySelectorAll('br');
        brTags.forEach(br => br.remove());
        return replacementsMade > 0;
    }

    // Removes Facebook like/share buttons.
    function removeFacebookElement() {
        let facebookIframe = null;
        facebookIframe = document.getElementById('facebook');
        if (facebookIframe && facebookIframe.tagName === 'IFRAME') {
        } else {
            facebookIframe = null;
        }
        if (!facebookIframe) {
            const potentialIframes = document.querySelectorAll('iframe');
            for (const iframe of potentialIframes) {
                if (iframe.src && (iframe.src.includes('facebook.com') || iframe.src.includes('fbcdn.net'))) {
                    facebookIframe = iframe;
                    break;
                }
            }
        }
        if (!facebookIframe) {
            const potentialIframesWithClass = document.querySelectorAll('iframe.uiGrid._51mz');
            if (potentialIframesWithClass.length > 0) {
                facebookIframe = potentialIframesWithClass[0];
            }
        }
        if (facebookIframe) {
            facebookIframe.remove();
        } else {
        }
    }

    // Sets up favorites display area in main menu.
    function addPurpleCircleToDesign2010() {
        const targetTd = document.querySelector('td[width="163"][class="design2010"][background="https://files.deadfrontier.com/deadfrontier/DF3Dimages/mainpage/menu_div6.jpg"]');
        if (targetTd) {
            renderFavoriteEmojiHolder();
            return true;
        }
        return false;
    }

    // Runs all initial setup tweaks on page load.
    let facebookRemoved = false;
    let oaLinkRemoved = false;
    let outpostButtonsProcessed = false;
    let design2010EmojiAdded = false;
    let oaSystemAdded = false;
    let bossMapAdded = false;
    function runInitialFixes() {
        addComfortaaFont();
        if (!facebookRemoved) {
            removeFacebookElement();
            facebookRemoved = true;
        }
        if (!oaLinkRemoved) {
            removeOALinkTable();
            oaLinkRemoved = true;
        }
        if (!bossMapAdded) {
            addBossMap();
            bossMapAdded = true;
        }
        if (!outpostButtonsProcessed) {
            if (replaceOutpostButtonText()) {
                outpostButtonsProcessed = true;
            }
        }
        if (!oaSystemAdded) {
            addOASystem();
            oaSystemAdded = true;
        }
        const weaponCount = getWeaponCount();
        fixArmourLayout(weaponCount);
        fixHealthLayout(weaponCount);
        fixNourishmentLayout(weaponCount);
        fixWeaponLayout();
        fixBoostsLayout();
        replaceMenuText();
        processCollectionBook();
        if (!design2010EmojiAdded) {
            if (addPurpleCircleToDesign2010()) {
                design2010EmojiAdded = true;
            }
        }
    }

    // Monitors DOM mutations to reapply UI fixes when page content changes dynamically
    let debounceTimer;
    const DEBOUNCE_DELAY = 100;
    const observerCallback = (mutationsList, observer) => {
        let needsMenuTextUpdate = false;
        let needsOutpostUpdate = false;
        let needsLayoutFixesLocal = false;
        let needsDesign2010Emoji = false;
        let needsCollectionBook = false;
        let needsOASystem = false;
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.closest('#sidebar')) {
                            needsMenuTextUpdate = true;
                            needsLayoutFixesLocal = true;
                        }
                        if (node.closest('#outpost')) {
                            needsOutpostUpdate = true;
                        }
                        if (node.tagName === 'A' && node.classList.contains('opElem') && node.textContent.trim().includes('Collection Book')) {
                            needsCollectionBook = true;
                        } else if (node.querySelector && node.querySelector('a.opElem[href*="page=82"]')) {
                            needsCollectionBook = true;
                        }
                        if (!facebookRemoved && (node.id === 'facebook' || (node.tagName === 'IFRAME' && (node.src?.includes('facebook.com') || node.src?.includes('fbcdn.net'))))) {
                            removeFacebookElement();
                            facebookRemoved = true;
                        }
                        if (!oaLinkRemoved && (node.tagName === 'TABLE' && node.getAttribute('width') === '550' && node.getAttribute('align') === 'center')) {
                            const link = node.querySelector('a[onclick*="OA.php"]');
                            if (link && link.textContent.includes('OA Warning System')) {
                                node.remove();
                                oaLinkRemoved = true;
                            }
                        }
                        if (node.tagName === 'TD' && node.classList.contains('design2010') && node.getAttribute('background')?.includes('menu_div6.jpg')) {
                            needsDesign2010Emoji = true;
                        }
                        if (node.querySelector('td[width="163"][class="design2010"][background="https://files.deadfrontier.com/deadfrontier/DF3Dimages/mainpage/menu_div6.jpg"]')) {
                            needsDesign2010Emoji = true;
                        }
                        if (node.matches && node.matches('td.design2010[width="275"][align="center"][valign="bottom"]') || (node.querySelector && node.querySelector('td.design2010[width="275"][align="center"][valign="bottom"]'))) {
                            needsOASystem = true;
                        }
                    }
                }
                for (const node of mutation.removedNodes) {
                    if (node.nodeType === 1 && node.closest('#sidebar')) {
                        if (node.classList.contains('opElem') && node.classList.contains('weapon')) {
                            needsLayoutFixesLocal = true;
                        }
                    }
                }
            } else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (mutation.target.id === 'sidebarArmour' ||
                    mutation.target.id === 'sidebarHealth' ||
                    mutation.target.id.includes('sidebarNourishment') ||
                    (mutation.target.classList?.contains('opElem') && (mutation.target.classList.contains('weapon') || mutation.target.classList.contains('boostTimes'))) ||
                    (mutation.target.id === 'htmlFlashReplace' || mutation.target.id === 'sidebar')) {
                    needsLayoutFixesLocal = true;
                }
            } else if (mutation.type === 'characterData') {
                if (mutation.target.parentElement?.matches('a[href="index.php?action=pm"]')) {
                    needsMenuTextUpdate = true;
                }
                if (mutation.target.parentElement?.matches('.heldCash, .heldCredits, span[style*="color: #cccccc"]')) {
                    needsLayoutFixesLocal = true;
                }
            }
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (needsLayoutFixesLocal) {
                const weaponCount = getWeaponCount();
                fixArmourLayout(weaponCount);
                fixHealthLayout(weaponCount);
                fixNourishmentLayout(weaponCount);
                fixWeaponLayout();
                fixBoostsLayout();
                adjustPlayerInfoPosition();
            }
            if (needsMenuTextUpdate) {
                replaceMenuText();
            }
            if (needsOutpostUpdate) {
                replaceOutpostButtonText();
            }
            if (needsCollectionBook) {
                processCollectionBook();
            }
            if (!facebookRemoved) {
                removeFacebookElement();
                if (document.getElementById('facebook') === null && !document.querySelector('iframe[src*="facebook.com"]')) {
                    facebookRemoved = true;
                }
            }
            if (!oaLinkRemoved) {
                removeOALinkTable();
                oaLinkRemoved = true;
            }
            if (!design2010EmojiAdded || needsDesign2010Emoji) {
                if (addPurpleCircleToDesign2010()) {
                    design2010EmojiAdded = true;
                }
            }
            if (!oaSystemAdded || needsOASystem) {
                addOASystem();
                oaSystemAdded = true;
            }
        }, DEBOUNCE_DELAY);
    };

    // Starts watching for page changes in sidebar and outpost.
    const mainObserver = new MutationObserver(observerCallback);
    function startObserving() {
        const sidebar = document.querySelector('#htmlFlashReplace #sidebar');
        const outpost = document.querySelector('#outpost');
        if (sidebar) {
            mainObserver.observe(sidebar, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style'],
                characterData: true,
                characterDataOldValue: false
            });
        } else {
        }
        if (outpost) {
            mainObserver.observe(outpost, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style'],
                characterData: true
            });
        } else {
        }
        mainObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        if (!sidebar || !outpost) {
            const initialDomReadyObserver = new MutationObserver((mutations, observer) => {
                let foundSidebar = document.querySelector('#htmlFlashReplace #sidebar');
                let foundOutpost = document.querySelector('#outpost');
                if (foundSidebar && !sidebar) {
                    mainObserver.observe(foundSidebar, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['style'], characterData: true
                    });
                }
                if (foundOutpost && !outpost) {
                    mainObserver.observe(foundOutpost, {
                        childList: true, subtree: true, attributes: true, attributeFilter: ['style'], characterData: true
                    });
                }
                if (document.querySelector('#htmlFlashReplace #sidebar') && document.querySelector('#outpost')) {
                    observer.disconnect();
                }
            });
            initialDomReadyObserver.observe(document.body, { childList: true, subtree: true });
        }
        runInitialFixes();
    }
    // Initialize script when DOM is ready or on full page load to ensure elements exist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startObserving, 50);
        });
    } else {
        setTimeout(startObserving, 50);
    }
    window.addEventListener('load', () => {
        runInitialFixes();
    });
})();
