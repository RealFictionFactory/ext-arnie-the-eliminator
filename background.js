chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge' && sender.tab) {
        const count = request.count;
        const tabId = sender.tab.id;

        // If count > 0, show a green badge with the number of changes. Otherwise, clear it.
        if (count > 0) {
            chrome.action.setBadgeText({ text: String(count), tabId: tabId });
            chrome.action.setBadgeBackgroundColor({ color: '#00cc00', tabId: tabId });
        } else {
            chrome.action.setBadgeText({ text: '', tabId: tabId });
        }
    }
});
