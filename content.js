// ==========================================
// CONFIGURATION
// Built-in selectors. The action here is overridden by the user's setting.
// ==========================================
const builtInSelectors = ['.fc-consent-root'];

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
        document.body.style.overflow = 'auto';
        changesCount++; // Count scroll fix as a change
    }
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

// 5. Main logic
function runChecks() {
    const foundAndHandledTarget = processTargets();
    
    if (foundAndHandledTarget) {
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
