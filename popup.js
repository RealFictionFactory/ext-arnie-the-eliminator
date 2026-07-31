// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['defaultAction', 'customSelectors'], (data) => {
        if (data.defaultAction) {
            const radio = document.querySelector(`input[name="action"][value="${data.defaultAction}"]`);
            if (radio) radio.checked = true;
        }
        if (data.customSelectors) {
            document.getElementById('customSelectors').value = data.customSelectors;
        }
    });
});

// Save settings on button click
document.getElementById('save').addEventListener('click', () => {
    const defaultAction = document.querySelector('input[name="action"]:checked').value;
    const customSelectors = document.getElementById('customSelectors').value;

    chrome.storage.local.set({ defaultAction, customSelectors }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved!';
        setTimeout(() => { status.textContent = ''; }, 2000);
    });
});
