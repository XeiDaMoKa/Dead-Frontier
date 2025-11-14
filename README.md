# Dead Frontier Script Collection

A comprehensive set of user scripts to enhance your Dead Frontier gaming experience with modern UI, automation features, and quality-of-life improvements.

![Dead Frontier Header](https://i.ibb.co/Df9vNzV6/Notion-DAZk-VHi-Vpl.png)

## 📋 Table of Contents

- [Features Overview](#features-overview)
- [Scripts Collection](#scripts-collection)
- [Installation Guide](#installation-guide)
- [Script Details](#script-details)
- [Layout Enhancements](#layout-enhancements)
- [Price Analysis](#price-analysis)
- [Item Management](#item-management)
- [Market Automation](#market-automation)
- [Mission Tracking](#mission-tracking)
- [Inventory Tools](#inventory-tools)
- [Quick Actions](#quick-actions)
- [Troubleshooting](#troubleshooting)

## 🌟 Features Overview

![Overview Features](https://i.ibb.co/zhmC6RpK/Notion-Pd8o-J2-PJty.png)

### Core Features
- **Modern UI Overhaul**: Complete redesign with custom fonts, colors, and layouts
- **Smart Automation**: Intelligent price analysis, auto-search, and quick actions
- **Enhanced Navigation**: Favorites system, boss map integration, and improved menu
- **Inventory Optimization**: Scrap value tracking, cheapest item highlighting
- **Market Enhancement**: Drag-and-drop search, price comparison, and service filtering
- **Mission Management**: Modern mission interface with progress tracking
- **Quick Actions**: Bank automation and market quick-buy functionality

## 📦 Scripts Collection

![Script Collection](https://i.ibb.co/PGXYH7vh/Notion-Jqy-En-QBr-Qr.png)

### Complete Script Suite
1. **Dead Frontier - Layouts** - UI/UX improvements and customization
2. **Dead Frontier - Prices** - Market value analysis and price comparison
3. **Dead Frontier - Items** - Item image fixes and optimization
4. **Dead Frontier - Market** - Market automation and search enhancement
5. **Dead Frontier - Missions** - Modern mission interface design
6. **Dead Frontier - Cheapest** - Inventory value analysis
7. **Dead Frontier - Favorites** - Quick actions and automation

## 🚀 Installation Guide

![Installation Guide](https://i.ibb.co/9HHKB6YV/Notion-FLYMw-BZckt.png)

### Prerequisites
- **UserScript Manager**: Install Tampermonkey or Greasemonkey browser extension
- **Browser Compatibility**: Chrome, Firefox, Edge, or Safari with script support

### Step-by-Step Installation

1. **Install UserScript Manager**
   - Chrome: [Tampermonkey Chrome Extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Tampermonkey Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2. **Install Scripts**
   - Click on each script link below
   - Confirm installation in your user script manager
   - Ensure all 7 scripts are installed for full functionality

3. **Verify Installation**
   - Visit the Dead Frontier website
   - Check for enhanced UI elements
   - Test script features individually

## 📝 Script Details

![Script Documentation](https://i.ibb.co/zH8MmGQQ/Notion-t-Ch8-MAQJhc.png)

## 🎨 Layout Enhancements

![Layout Features](https://i.ibb.co/xq6qhxss/vivaldi-QOM69-F0e-FC.png)

### Dead Frontier - Layouts
**Purpose**: Complete UI/UX overhaul and layout improvements

#### Key Features:
- **Custom Typography**: Comfortaa font implementation with bold styling
- **Smart Icons**: Replaced text buttons with custom icons across the interface
- **Favorites System**: Quick access to favorite locations (up to 5)
- **Boss Map Integration**: Toggle-able boss map overlay
- **OA System**: Real-time outpost attack monitoring with siren alerts
- **Player Info Enhancement**: Improved sidebar with XP progress bars
- **Weapon Layout**: Dynamic weapon positioning based on equipped items
- **Status Indicators**: Health, armor, and nourishment with visual feedback

#### Technical Implementation:
```javascript
// Custom font integration
function addComfortaaFont() {
    const style = document.createElement('style');
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700;900&display=swap');
        body, button, input, select, textarea {
            font-family: 'Comfortaa', sans-serif !important;
        }
    `;
    document.head.appendChild(style);
}
```

#### Installation:
```javascript
// ==UserScript==
// @name                        Dead Frontier - Layout
// @version                     1.00
// @description              Organizes Player Display, Adds icons to outpost and adds favorites
// @author                      XeiDaMoKa [2373510]
// @match                       https://fairview.deadfrontier.com/*
// ==/UserScript==
```

## 💰 Price Analysis

![Price Features](https://i.ibb.co/xqg6ZGR2/vivaldi-px2-OEKJR7-F.png)
![Price Analysis](https://i.ibb.co/S4YX0DYR/vivaldi-o8ifqg-PKIH.png)

### Dead Frontier - Prices
**Purpose**: Market value analysis and price comparison in real-time

#### Key Features:
- **Live Market Data**: Real-time price fetching from Dead Frontier API
- **Smart Color Handling**: Accurate color prefix processing for items
- **Collection Book Integration**: Tracks collected items across all colors
- **Ammo Special Handling**: Per-unit pricing for ammunition
- **Scrap Comparison**: Profit/loss analysis against scrap values
- **Price Caching**: Efficient API usage with intelligent caching

#### Advanced Features:
- **Exact Match Searching**: Handles color variants and base item names
- **Market Value Calculator**: Best market value considering partial sales
- **Collection Tracking**: Aggregates quantities across color variants
- **Tooltip Enhancement**: Rich pricing information in item hover tooltips

#### API Integration:
```javascript
async function fetchMarketListings(searchItemName, targetColor) {
    const payload = {
        hash: hash,
        pagetime: pagetime,
        tradezone: 21,
        search: 'trades',
        searchtype: 'buyinglistitemname',
        searchname: apiSearchName
    };
    // Fetches and processes market data
}
```

## 🎒 Item Management

![Item Features](https://i.ibb.co/9mQQYXR3/chrome-o-Nmff0v-FLE.png)

### Dead Frontier - Items
**Purpose**: Item image fixes and visual optimization

#### Key Features:
- **Colored Item Images**: Fixes colored variants of clothing and armor
- **Mask Fallback System**: Intelligent fallback to mask2 directory
- **Weapon Zoom Optimization**: Enhanced weapon image display
- **Dynamic Positioning**: Item-specific positioning adjustments
- **Tooltip Integration**: Improved item visualization in tooltips

#### Supported Categories:
- **Armor Types**: All colored armor variants
- **Clothing**: Shirts, coats, trousers, hats
- **Protective Gear**: Masks, helmets, tactical gear
- **Weapons**: Enhanced weapon image handling

## 🛒 Market Automation

![Market Features](https://i.ibb.co/q3LSmzNt/chrome-i-QOdu7-P0-Js.png)
![Search Enhancement](https://i.ibb.co/8nnc10tJ/vivaldi-zfx3-KE7u-FG.png)
![Service Filtering](https://i.ibb.co/dsCRdTWy/vivaldi-mjc-W4j90-Lu.png)

### Dead Frontier - Market
**Purpose**: Advanced market search and automation features

#### Key Features:
- **Drag-and-Drop Search**: Intuitive item search via drag-and-drop
- **Smart Service Detection**: Automatic categorization of services
- **Item Name Coloring**: Visual color coding for colored items
- **Long Name Optimization**: Improved handling of lengthy item names
- **Category Management**: Enhanced service and item categorization

#### Automation Features:
- **Pending Search System**: Seamless cross-page search functionality
- **Service Filtering**: Shows cheapest service per level
- **Manual Category Support**: Preserves user category selections
- **Global Item Support**: Works across all game pages

#### Drag-and-Drop Implementation:
```javascript
document.addEventListener('mouseup', e => {
    const marketIcon = under.closest('a[title="Marketplace"]');
    if (marketIcon && mouseDownItem.tooltipData.name) {
        localStorage.setItem(PENDING_SEARCH_KEY, JSON.stringify({
            name: mouseDownItem.tooltipData.name,
            type: mouseDownItem.type,
            category: categoryInfo
        }));
        simulateClick(marketIcon);
    }
});
```

## 🎯 Mission Tracking

![Mission Features](https://i.ibb.co/2xJXRb5/vivaldi-OIIQ9r-X6f-T.png)
![Progress Tracking](https://i.ibb.co/XkYRWdnS/vivaldi-IKa7h-Nw2ql.png)

### Dead Frontier - Missions
**Purpose**: Modern mission interface with enhanced tracking

#### Key Features:
- **Card-Based Design**: Modern mission cards with status indicators
- **Dynamic Progress Bars**: Animated progress with color gradients
- **Collapsible Interface**: Expandable mission details
- **Real-time Countdown**: Live deadline tracking
- **Reward Highlighting**: Clear reward display and organization
- **Objective Breakdown**: Individual objective progress tracking

#### Design Elements:
- **Color-Coded Status**: Dynamic colors based on completion percentage
- **Orbitron Typography**: Futuristic font for mission titles
- **Responsive Grid**: Mobile-friendly layout
- **Animations**: Smooth transitions and shine effects

#### Mission Data Processing:
```javascript
function createMissionCard(missionElement) {
    const missionData = extractMissionData(missionElement);
    const progress = parseProgress(missionData.progressBar.style.width);
    const colorRgb = getDynamicColor(progress);
    // Creates modern mission card with all features
}
```

## 💎 Inventory Tools

![Inventory Tools](https://i.ibb.co/1frknc2v/vivaldi-6-X3-PUPk-Je-C.png)
![Value Tracking](https://i.ibb.co/N23qKyRT/vivaldi-i-Ic2a802-GX.png)

### Dead Frontier - Cheapest
**Purpose**: Automated inventory value analysis and optimization

#### Key Features:
- **Auto Scrap Detection**: Automatic scrap value calculation for all items
- **Visual Highlighting**: Yellow glow for cheapest items
- **Ignore System**: Drag items to exclude from calculations
- **Real-time Updates**: Instant recalculation on inventory changes
- **Tooltip Integration**: Shows ignored item names

#### Smart Features:
- **Direct Computation**: No hover required for price detection
- **Persistent Settings**: Ignored items saved across sessions
- **Visual Feedback**: Color-coded highlighting system
- **Cross-page Support**: Works on all inventory pages

#### Drag-and-Drop Implementation:
```javascript
document.addEventListener('mouseup', e => {
    const ignoreZoneUnder = under?.closest('.opElem[style*="bottom: 90px"]');
    if (ignoreZoneUnder && mouseDownItem.type) {
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
});
```

## ⚡ Quick Actions

![Quick Actions](https://i.ibb.co/kpzStBK/vivaldi-y-Og5-SVTt4p.png)
![Automation Panel](https://i.ibb.co/hRyMnTX3/vivaldi-Y7m-Y4b-FN2m.png)
![Market Integration](https://i.ibb.co/rf55Yw94/vivaldi-QTNLf-GPv-S8.png)

### Dead Frontier - Favorites
**Purpose**: Bank automation and market quick-buy functionality

#### Key Features:
- **Auto Bank Actions**: Hover panels for deposit/withdraw operations
- **Quick Buy System**: Smart market purchasing with price analysis
- **Medical Item Focus**: Prioritized healing item purchases
- **Ammo Tracking**: Bullet and supply management
- **Food Optimization**: Hunger restoration efficiency

#### Automation Features:
- **Hover Panels**: Context-sensitive action panels
- **Price Analysis**: Real-time market price comparison
- **Bulk Purchasing**: Multiple item acquisition
- **Smart Navigation**: Automatic return to original page

#### Quick Buy Categories:
- **Medical Items**: Antibiotics, Bandages, First Aid Kits
- **Ammunition**: Bullets, Shells, Grenades, Energy Cells
- **Food Supplies**: High-efficiency hunger restoration items

#### Hover Panel System:
```javascript
function addHoverLogic(iconElement, panelElement) {
    iconElement.addEventListener('mouseenter', () => {
        showPanel();
    });
    panelElement.addEventListener('mouseleave', () => {
        hidePanel();
    });
}
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Scripts Not Loading
- **Check UserScript Manager**: Ensure Tampermonkey/Greasemonkey is enabled
- **Verify Script URLs**: Ensure all script URLs are accessible
- **Browser Console**: Check for JavaScript errors in browser console

#### Features Not Working
- **Page Refresh**: Some features require page reload after installation
- **Cache Clear**: Clear browser cache if UI elements appear broken
- **Script Order**: Ensure Layouts script loads first for best compatibility

#### Performance Issues
- **Script Conflicts**: Disable scripts one by one to identify conflicts
- **Browser Performance**: Close unnecessary tabs and extensions
- **API Rate Limits**: Price fetching may be throttled during high usage

#### Market Features Issues
- **Search Functionality**: Ensure drag-and-drop has sufficient distance (>5px)
- **Pending Searches**: Clear localStorage if searches get stuck
- **Service Detection**: Some service items may not auto-categorize

### Debug Mode
Enable console logging by adding this to any script:
```javascript
console.log('[ScriptName Debug]', { status: 'initialized', feature: 'active' });
```

### Support Resources
- **Bug Reports**: Use browser console to capture error messages
- **Feature Requests**: Describe expected vs actual behavior
- **Compatibility Issues**: Include browser version and user script manager details

## 📈 Performance Optimizations

### Caching Strategy
- **Market Data**: 60-second cache for price information
- **Local Storage**: Persistent settings and favorites
- **Session Storage**: Temporary data like pending searches

### API Efficiency
- **Request Throttling**: Prevents excessive API calls
- **Batch Processing**: Groups multiple operations
- **Fallback Systems**: Alternative data sources when APIs fail

### Memory Management
- **Observer Cleanup**: Proper disconnection of DOM observers
- **Event Listener Management**: Prevents memory leaks
- **Data Structure Optimization**: Efficient storage of large datasets

## 🔒 Privacy and Security

### Data Handling
- **Local Storage Only**: All data stored locally in browser
- **No External Servers**: Scripts communicate directly with Dead Frontier
- **Session-based**: Temporary data cleared on page close
- **User Control**: All features can be disabled individually

### API Usage
- **Official Endpoints**: Uses only Dead Frontier's official API
- **No Data Collection**: No user data transmitted to third parties
- **Rate Limiting**: Respects server load with intelligent throttling

---

## 📄 License and Credits

**Author**: XeiDaMoKa [2373510]
**Version**: 1.0.0
**Last Updated**: November 2025

### Script Sources
- **Main Repository**: [GitHub - XeiDaMoKa Scripts](https://github.com/XeiDaMoKa/Torn/raw/Xei/Scripts/Aquarius/)
- **Documentation**: [Notion - Dead Frontier Layouts](https://xeidamoka.notion.site/Dead-Frontier-Layouts-2a02a9c404f780acbeb6f82c95f72d91)
- **Support**: [Dead Frontier Messages](https://fairview.deadfrontier.com/onlinezombiemmo/index.php?action=pm;sa=send)

### Special Thanks
- **Community**: Dead Frontier player community for feedback and testing
- **Game Developers**: For creating the amazing Dead Frontier experience
- **Contributors**: Various script enhancements and bug fixes

---

*This README covers the complete Dead Frontier script collection. For individual script documentation or specific issues, refer to the respective script comments and the support resources above.*