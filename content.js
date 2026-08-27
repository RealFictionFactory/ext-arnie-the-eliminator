// ==========================================
// CONFIGURATION
// Built-in selectors. The action here is overridden by the user's setting.
// ==========================================
const builtInSelectors = [
    // classes
    '.fc-consent-root', '.cmp-app_gdpr',
    // IDs
    '#onetrust-consent-sdk', '#cmpwrapper', '#cmp',
    '#gr-consent-layer-area', '#didomi-css', '#didomi-host',
];

// Some consent managers generate a new class name for every page load, but put
// their overlay on an almost-maximum CSS layer.  This value is deliberately
// very high so normal site dialogs, menus, and notifications are not targets.
const suspiciousZIndex = 2147483000;

let userSettings = { defaultAction: 'remove', customSelectors: [] };
let changesCount = 0;

// 1. Load settings from storage, then initialize the script
chrome.storage.local.get(['defaultAction', 'customSelectors'], (data) => {
    userSettings.defaultAction = data.defaultAction || 'remove';
    
    // Parse the comma-separated string into an array, removing empty spaces
    if (data.customSelectors) {
        userSettings.customSelectors = data.customSelectors.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    initializeScript();
});

// 2. Fix scroll lock
function fixScroll() {
    if (document.body && document.body.style.overflow !== 'auto') {
        document.body.classList.remove('cmp');
        document.documentElement.style.overflow = 'auto';
        document.body.style.setProperty('overflow', 'auto', 'important');
        changesCount++; // Count scroll fix as a change
    }
}

// 2.5 Handle site-specific edge cases (e.g., wiadomosci.wp.pl, money.pl)
function handleSpecificSites() {
    let targetWasHandled = false;

    // Array of sites that use the random class body blur and first div overlay
    const specificSites = [
        'wiadomosci.wp.pl',
        'money.pl'
    ];

    // Check if the current URL matches any of the sites in the array
    const isSpecificSite = specificSites.some(site => window.location.href.includes(site));

    if (isSpecificSite) {
        const overlay = document.body.firstElementChild;
        
        // 1. Determine the first div inside body (the popup overlay) and remove it
        // We check for role="dialog" or aria-modal to ensure we only remove the popup, not actual content
        if (overlay && overlay.tagName === 'DIV') {
            const isDialog = overlay.getAttribute('role') === 'dialog' || overlay.querySelector('[role="dialog"], [aria-modal="true"]');
            if (isDialog) {
                overlay.remove();
                targetWasHandled = true;
                changesCount++;
            }
        }
        
        // 2. Make class value for body element empty to unblur the content
        // We check if it's not already empty to avoid redundant actions
        if (document.body.className !== '') {
            document.body.className = '';
            targetWasHandled = true;
            changesCount++;
        }
        
        // 3. Ensure scrolling is restored specifically for this site
        if (document.documentElement.style.overflow === 'hidden' || document.body.style.overflow === 'hidden') {
            document.documentElement.style.overflow = 'auto';
            document.body.style.overflow = 'auto';
            targetWasHandled = true;
        }
    }

    return targetWasHandled;
}

// 3. Handle individual elements based on action
function handleElement(el, action) {
    if (action === 'hide') {
        if (el.style.display !== 'none') {
            el.style.display = 'none';
            return true; // Was changed
        }
    } else if (action === 'remove') {
        if (el.parentNode) { // Ensure it hasn't been removed already
            el.remove();
            return true; // Was changed
        }
    }
    return false; // No change was needed
}

// 4. Process targets
function processTargets() {
    let targetWasHandled = false;
    const actionToTake = userSettings.defaultAction;

    // Combine built-in and custom selectors into one loop
    const allSelectors = [...builtInSelectors, ...userSettings.customSelectors];

    allSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (handleElement(el, actionToTake)) {
                    targetWasHandled = true;
                    changesCount++;
                }
            });
        } catch (e) {
            console.warn(`Invalid selector skipped: ${selector}`);
        }
    });

    return targetWasHandled;
}

// Find full-screen/modal overlays whose class name cannot be targeted reliably.
// Sampling the elements currently on top of the viewport is much cheaper than
// calculating the style of every element on every MutationObserver callback.
function processHighZIndexOverlays() {
    if (!document.elementsFromPoint || !window.innerWidth || !window.innerHeight) {
        return false;
    }

    const points = [
        [0.5, 0.5], [0.5, 0.1], [0.5, 0.9],
        [0.1, 0.5], [0.9, 0.5], [0.1, 0.1],
        [0.9, 0.1], [0.1, 0.9], [0.9, 0.9],
    ];
    const candidates = new Set();

    points.forEach(([x, y]) => {
        document.elementsFromPoint(Math.round(window.innerWidth * x), Math.round(window.innerHeight * y))
            .forEach(element => {
                // The element at a point can be a child of the overlay. Check
                // its ancestors as well, stopping before page-level elements.
                for (let current = element; current && current !== document.body; current = current.parentElement) {
                    candidates.add(current);
                }
            });
    });

    let targetWasHandled = false;
    candidates.forEach(element => {
        if (!element.isConnected) {
            return;
        }

        const style = window.getComputedStyle(element);
        const zIndex = Number.parseInt(style.zIndex, 10);
        const isOverlay = style.position === 'fixed' || style.position === 'absolute';
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;

        if (isOverlay && isVisible && zIndex >= suspiciousZIndex && handleElement(element, userSettings.defaultAction)) {
            targetWasHandled = true;
            changesCount++;
        }
    });

    return targetWasHandled;
}

// 5. Main logic
function runChecks() {
    const foundAndHandledTarget = processTargets();
    const foundAndHandledHighZOverlay = processHighZIndexOverlays();
    const handledSpecificSite = handleSpecificSites();
    
    if (foundAndHandledTarget || foundAndHandledHighZOverlay || handledSpecificSite) {
        fixScroll();
        updateBadge();
    }
}

// 6. Send message to background script to update the icon badge
function updateBadge() {
    if (changesCount > 0) {
        chrome.runtime.sendMessage({ action: 'updateBadge', count: changesCount });
    }
}

// 7. Initialize and setup MutationObserver
function initializeScript() {
    // Run initial check as soon as possible
    const checkBodyInterval = setInterval(() => {
        if (document.body) {
            clearInterval(checkBodyInterval);
            runChecks();

            // Start observing
            const observer = new MutationObserver(() => {
                runChecks();
            });

            const config = { attributes: true, childList: true, subtree: true };
            observer.observe(document.body, config);
        }
    }, 50); // Check every 50ms until <body> appears
}
