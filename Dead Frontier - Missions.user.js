// ==UserScript==
// @name         Dead Frontier Missions
// @description  Displays market value in items tooltips with price comparison. Handles color prefixes in item names for accurate price searching. Saves collection book items to storage on tab switch and displays collected quantity in tooltips (aggregating across colors for base item). Also works in collection book tooltips and market search results.
// @version      1.0.0
// @author                      XeiDaMoKa [2373510]
// @source                      https://xeidamoka.notion.site/Dead-Frontier-Layouts-2a02a9c404f780acbeb6f82c95f72d91
// @downloadURL          https://github.com/XeiDaMoKa/Torn/raw/Xei/Scripts/Aquarius//ChainWatchers.user.js
// @updateURL              https://github.com/XeiDaMoKa/Torn/raw/Xei/Scripts/Aquarius//ChainWatchers.user.js
// @supportURL             https://fairview.deadfrontier.com/onlinezombiemmo/index.php?action=pm;sa=send
// @supportURL             https://github.com/XeiDaMoKa/Torn/issues
// @match                       https://fairview.deadfrontier.com/*
// @icon                           https://www.google.com/s2/favicons?sz=64&domain=deadfrontier.com
// ==/UserScript==

(function() {
    'use strict';

    // Changes Font , pick any google font of your liking
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Barlow+Condensed:wght@300;400;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const style = document.createElement('style');
    style.textContent = `
        .df-mission-redesign {
            font-family: 'Barlow Condensed', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0f0f 100%);
            min-height: 100vh;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
        }
        .df-mission-redesign::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background:
                radial-gradient(circle at 80% 20%, rgba(20, 255, 50, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(255, 100, 0, 0.05) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
        .df-mission-redesign::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.03) 0px,
                rgba(0, 0, 0, 0.03) 1px,
                transparent 1px,
                transparent 2px
            );
            pointer-events: none;
            z-index: 1000;
        }
        .missions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }
        .mission-card {
            --status-color: #ff4444;
            --status-rgb: 255, 68, 68;
            --status-glow: rgba(255, 68, 68, 0.3);
            --status-glow-alt: rgba(255, 68, 68, 0.2);
            background:
                linear-gradient(145deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.95) 100%),
                url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="none" stroke="%23333" stroke-width="2" x="10" y="10" width="80" height="80"/></svg>');
            border: 1px solid #444;
            border-radius: 8px;
            padding: 0;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow:
                0 4px 20px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .mission-card.status-complete {
            border: 3px solid var(--status-color);
        }
        .mission-card.status-complete::before {
            display: none;
        }
        .mission-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--status-color);
        }
        .mission-card:hover {
            transform: translateY(-5px);
            box-shadow:
                0 8px 30px var(--status-glow),
                0 2px 10px var(--status-glow-alt);
        }
        .mission-header {
            background: linear-gradient(135deg, rgba(var(--status-rgb), 0.2) 0%, rgba(var(--status-rgb), 0.1) 100%);
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
            user-select: none;
        }
        .mission-header:hover {
            background: linear-gradient(135deg, rgba(var(--status-rgb), 0.3) 0%, rgba(var(--status-rgb), 0.2) 100%);
        }
        .mission-header::after {
            content: '▼';
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--status-color);
            font-size: 0.8em;
            transition: transform 0.3s ease;
        }
        .mission-header.collapsed::after {
            transform: translateY(-50%) rotate(-90deg);
        }
        .mission-title {
            font-family: 'Orbitron', monospace;
            font-size: 1.4em;
            font-weight: 700;
            color: var(--status-color);
            text-shadow: 0 0 10px rgba(var(--status-rgb), 0.5);
            margin: 0;
            letter-spacing: 1px;
        }
        .mission-deadline {
            font-size: 0.9em;
            color: #fff;
            margin-top: 5px;
            font-weight: 300;
        }
        .mission-countdown {
            font-size: 0.8em;
            color: #fff;
            margin-top: 2px;
            font-weight: 300;
        }
        .mission-content {
            padding: 20px;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        .mission-content.collapsed {
            display: none;
        }
        .mission-description {
            color: #ccc;
            line-height: 1.5;
            margin-bottom: 20px;
            font-size: 1.1em;
            border-left: 3px solid var(--status-color);
            border-right: 3px solid var(--status-color);
            padding-left: 15px;
            padding-right: 15px;
        }
        .mission-rewards {
            background: rgba(var(--status-rgb), 0.1);
            border: 1px solid var(--status-color);
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .rewards-title {
            font-family: 'Orbitron', monospace;
            color: var(--status-color);
            font-size: 1.1em;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .reward-item {
            display: inline-block;
            background: linear-gradient(135deg, rgba(var(--status-rgb), 0.2), rgba(var(--status-rgb), 0.1));
            border: 1px solid var(--status-color);
            border-radius: 4px;
            padding: 8px 12px;
            margin: 5px;
            color: var(--status-color);
            font-size: 0.9em;
        }
        .mission-objectives {
            margin-bottom: 20px;
        }
        .objective-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .objective-text {
            color: #eee;
            margin-bottom: 8px;
            font-size: 1em;
        }
        .objective-progress-bar {
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }
        .objective-progress-fill {
            height: 100%;
            border-radius: 4px;
            position: relative;
            transition: width 0.5s ease;
            background: var(--status-color);
        }
        .objective-progress-fill.completed {
            background: #44ff44;
        }
        .objective-progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
            animation: shine 2s infinite;
        }
        .objective-progress-fill.completed::after {
            display: none;
        }
        .objective-percentage {
            position: absolute;
            right: 0;
            top: -20px;
            font-size: 0.8em;
            font-weight: 600;
            color: var(--status-color);
        }
        .objective-percentage.completed {
            color: #44ff44;
        }
        .mission-overall-progress {
            background: rgba(var(--status-rgb), 0.1);
            border-radius: 6px;
            padding: 15px;
            border: 1px solid var(--status-color);
        }
        .progress-label {
            color: #ccc;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 1px;
        }
        .overall-progress-bar {
            height: 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            overflow: hidden;
            position: relative;
        }
        .overall-progress-fill {
            height: 100%;
            border-radius: 6px;
            position: relative;
            transition: width 0.5s ease;
            background: var(--status-color);
        }
        .overall-progress-fill.completed {
            background: #44ff44;
        }
        .overall-progress-fill::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
            animation: shine 2s infinite;
        }
        .overall-progress-fill.completed::before {
            display: none;
        }
        .progress-percentage {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--status-color);
            font-weight: 700;
            font-size: 0.8em;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
        }
        .progress-percentage.completed {
            color: #44ff44;
        }
        .mission-overview {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
            font-size: 0.9em;
            color: #aaa;
        }
        .overview-progress {
            color: var(--status-color);
            font-weight: 600;
        }
        .overview-objectives {
            color: var(--status-color);
        }
        @keyframes shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        @media (max-width: 768px) {
            .missions-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            .mission-content {
                padding: 15px;
            }
            .mission-header {
                padding: 12px 15px;
            }
            .mission-title {
                font-size: 1.2em;
            }
        }
    `;
    document.head.appendChild(style);

    // Parses progress percentage from width style string.
    function parseProgress(widthStyle) {
        const match = widthStyle.match(/(\d+(?:\.\d+)?)%/);
        return match ? parseFloat(match[1]) : 0;
    }

    // Counts completed objectives in the list.
    function countCompletedObjectives(objectives) {
        return objectives.filter(obj => obj.progress === 100).length;
    }

    // Generates dynamic color based on progress percentage.
    function getDynamicColor(progress) {
        const p = progress / 100;
        let r, g, b;
        if (p <= 0.5) {
            r = 255;
            g = 68 + (102 * (p / 0.5));
            b = 68 - (68 * (p / 0.5));
        } else {
            const pp = (p - 0.5) / 0.5;
            r = 255 - (187 * pp);
            g = 170 + (85 * pp);
            b = 0 + (68 * pp);
        }
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Converts RGB color to hex format.
    function rgbToHex(rgb) {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return '#ff4444';
        const [, r, g, b] = match;
        return '#' + [r, g, b].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }

    // Formats remaining time until end date.
    function formatRemainingTime(endDate) {
        const now = Date.now();
        const diff = endDate - now;
        if (diff < 0) return 'Expired';
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30.44); // Approximate
        const years = Math.floor(days / 365.25);

        let remaining = seconds;
        let parts = [];

        const y = Math.floor(remaining / (365.25 * 24 * 3600));
        if (y > 0) {
            parts.push(`${y}y`);
            remaining %= y * 365.25 * 24 * 3600;
        }
        const m = Math.floor(remaining / (30.44 * 24 * 3600));
        if (m > 0) {
            parts.push(`${m}m`);
            remaining %= m * 30.44 * 24 * 3600;
        }
        const w = Math.floor(remaining / (7 * 24 * 3600));
        if (w > 0) {
            parts.push(`${w}w`);
            remaining %= w * 7 * 24 * 3600;
        }
        const d = Math.floor(remaining / (24 * 3600));
        if (d > 0) {
            parts.push(`${d}d`);
            remaining %= d * 24 * 3600;
        }
        const h = Math.floor(remaining / 3600);
        if (h > 0) {
            parts.push(`${h}h`);
            remaining %= 3600;
        }
        const min = Math.floor(remaining / 60);
        if (min > 0) {
            parts.push(`${min}m`);
            remaining %= 60;
        }
        if (remaining > 0) {
            parts.push(`${remaining}s`);
        }
        return parts.length > 0 ? parts.join(' ') : '0s';
    }

    // Updates countdown timers for mission deadlines.
    function updateCountdowns() {
        document.querySelectorAll('.mission-countdown').forEach(span => {
            const endStr = span.dataset.end;
            if (endStr) {
                const endDate = new Date(endStr).getTime();
                span.textContent = formatRemainingTime(endDate);
            }
        });
    }

    // Creates a mission card element from mission data.
    function createMissionCard(missionElement) {
        const missionData = extractMissionData(missionElement);
        const progress = parseProgress(missionData.progressBar.style.width);
        const completedObjectives = countCompletedObjectives(missionData.objectives);
        const totalObjectives = missionData.objectives.length;
        const card = document.createElement('div');
        const isComplete = progress === 100;
        card.className = `mission-card ${isComplete ? 'status-complete' : ''}`;
        const colorRgb = getDynamicColor(progress);
        const colorHex = rgbToHex(colorRgb);
        const rgbMatch = colorRgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
        const rgb = rgbMatch ? `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}` : '255, 68, 68';
        const glow = `rgba(${rgb}, 0.3)`;
        const glowAlt = `rgba(${rgb}, 0.2)`;
        card.style.setProperty('--status-color', colorHex);
        card.style.setProperty('--status-rgb', rgb);
        card.style.setProperty('--status-glow', glow);
        card.style.setProperty('--status-glow-alt', glowAlt);
        const deadlineDiv = document.createElement('div');
        deadlineDiv.className = 'mission-deadline';
        deadlineDiv.textContent = missionData.deadline;
        const countdownSpan = document.createElement('span');
        countdownSpan.className = 'mission-countdown';
        countdownSpan.dataset.end = missionData.deadline; // Assuming deadline is parsable by Date
        card.innerHTML = `
            <div class="mission-header collapsed">
                <h3 class="mission-title">${missionData.title}</h3>
                ${deadlineDiv.outerHTML}
                ${countdownSpan.outerHTML}
                <!-- Quick overview that shows even when collapsed -->
                <div class="mission-overview">
                    <span class="overview-progress">${Math.round(progress)}% Complete</span>
                    ${totalObjectives > 0 ?
                        `<span class="overview-objectives">${completedObjectives}/${totalObjectives} Objectives</span>` :
                        '<span class="overview-objectives">No Objectives</span>'
                    }
                </div>
            </div>
            <div class="mission-content collapsed">
                <div class="mission-description">${missionData.description}</div>
                ${missionData.rewards.length > 0 ? `
                <div class="mission-rewards">
                    <div class="rewards-title">REWARDS</div>
                    <div class="rewards-list">
                        ${missionData.rewards.map(reward =>
                            `<span class="reward-item">${reward}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
                ${missionData.objectives.length > 0 ? `
                <div class="mission-objectives">
                    ${missionData.objectives.map(obj => {
                        const objColorRgb = getDynamicColor(obj.progress);
                        const objColorHex = rgbToHex(objColorRgb);
                        const completedClass = obj.progress === 100 ? 'completed' : '';
                        return `
                        <div class="objective-item">
                            <div class="objective-text">${obj.text}</div>
                            <div class="objective-progress-bar">
                                <div class="objective-progress-fill ${completedClass}" style="width: ${obj.progress}%;"></div>
                                <div class="objective-percentage ${completedClass}">${Math.round(obj.progress)}%</div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                ` : ''}
                <div class="mission-overall-progress">
                    <div class="progress-label">MISSION PROGRESS</div>
                    <div class="overall-progress-bar">
                        <div class="overall-progress-fill ${progress === 100 ? 'completed' : ''}" style="width: ${progress}%;"></div>
                        <div class="progress-percentage ${progress === 100 ? 'completed' : ''}">${Math.round(progress)}%</div>
                    </div>
                </div>
            </div>
        `;

        // Add click event to header for collapsing/expanding
        const header = card.querySelector('.mission-header');
        const content = card.querySelector('.mission-content');
        header.addEventListener('click', function() {
            const isCollapsed = header.classList.contains('collapsed');
            if (isCollapsed) {
                header.classList.remove('collapsed');
                content.classList.remove('collapsed');
            } else {

                header.classList.add('collapsed');
                content.classList.add('collapsed');
            }
        });
        return card;
    }

    // Extracts mission data from element.
    function extractMissionData(missionElement) {
        const titleElement = missionElement.querySelector('.challengeNamefield');
        const titleText = titleElement ? titleElement.childNodes[0].textContent.trim() : 'Unknown Mission';
        const deadlineElement = titleElement.querySelector('span');
        const deadline = deadlineElement ? deadlineElement.textContent.replace('Ends: ', '') : '';
        const completeElement = titleElement.querySelector('.challengeComplete');

        const description = missionElement.querySelector('.challengeDescription')?.textContent || 'No description available.';

        // Extract rewards
        const rewards = [];
        const cashElements = missionElement.querySelectorAll('.cashhack:not(.redElements)');
        cashElements.forEach(el => {
            const text = el.getAttribute('data-cash') || el.textContent;
            if (text && !text.includes('Rewards')) {
                rewards.push(text);
            }
        });
        const itemRewards = missionElement.querySelectorAll('.fakeItem');
        itemRewards.forEach(item => {
            const quantity = item.getAttribute('data-quantity') || '1';
            const type = item.getAttribute('data-type') || '';
            const text = item.textContent.trim();
            rewards.push(text);
        });

        // Extract objectives
        const objectives = [];
        const objectiveElements = missionElement.querySelectorAll('.challengeObjective');
        objectiveElements.forEach(obj => {
            const progressBar = obj.querySelector('.objectiveProgress');
            const progressText = obj.querySelector('.pads')?.textContent || '';
            const progress = parseProgress(progressBar.style.width);
            objectives.push({
                text: progressText,
                progress: progress
            });
        });
        const progressBar = missionElement.querySelector('.challengeBar');
        return {
            title: titleText,
            deadline: deadline,
            complete: !!completeElement,
            description: description,
            rewards: rewards,
            objectives: objectives,
            progressBar: progressBar
        };
    }

    // Replaces the mission container with redesigned layout.
    function replaceMissionContainer() {
        const originalContainer = document.querySelector('.challengeContainer');
        if (!originalContainer) return;
        const mainContainer = originalContainer.parentElement;
        const missionContainers = document.querySelectorAll('.challengeContainer');
        const newContainer = document.createElement('div');
        newContainer.className = 'df-mission-redesign';
        const missionsGrid = document.createElement('div');
        missionsGrid.className = 'missions-grid';
        missionContainers.forEach(mission => {
            const missionCard = createMissionCard(mission);
            missionsGrid.appendChild(missionCard);
        });
        newContainer.appendChild(missionsGrid);
        mainContainer.innerHTML = '';
        mainContainer.appendChild(newContainer);
        updateCountdowns();
        setInterval(updateCountdowns, 1000);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceMissionContainer);
    } else {
        replaceMissionContainer();
    }
    setTimeout(replaceMissionContainer, 1000);
})();