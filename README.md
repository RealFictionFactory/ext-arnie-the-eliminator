# Arnie the Eliminator

> *"Hasta la vista, baby."*

A cross-browser extension that hunts down intrusive popups (like aggressive cookie consent walls) and eliminates them. When it successfully takes out a target, it also unlocks the page's scrolling by removing `overflow: hidden` from the `<body>` tag—without breaking websites that use scroll-locking legitimately.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange.svg)
![Browsers](https://img.shields.io/badge/Supported-Chrome%20%7C%20Edge%20%7C%20Firefox-green.svg)

---

## Features

* **Targeted Elimination:** Removes or hides specific popups based on CSS selectors. 
* **Smart Scroll Unlock:** Only disables `overflow: hidden` on the `<body>` if a popup was actually found and eliminated. It leaves intentionally locked layouts alone.
* **Hide vs. Remove:** Choose whether Arnie should completely remove elements from the DOM (`el.remove()`) or just hide them from view (`display: none`).
* **Custom Hit List:** Add your own CSS classes or IDs via the popup UI to target specific popups on any website.
* **Visual Indicator:** A badge on the extension icon shows exactly how many changes Arnie made on the current page.
* **Persistent Guard:** Uses a `MutationObserver` to watch for dynamic changes. If a website tries to re-inject a popup seconds later, Arnie takes it out again.
* **Cross-Browser:** Built with Manifest V3, compatible with Chrome, Edge, and Firefox.

---

## Installation (For Developers / Local Testing)

Because this extension isn't on the Web Store yet, you can load it locally.

### Chrome / Edge
1. Download or clone this repository to your local machine.
2. Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **"Developer mode"** (top right corner).
4. Click **"Load unpacked"**.
5. Select the folder containing the extension files.

### Firefox
1. Download or clone this repository.
2. Navigate to `about:debugging` in Firefox.
3. Click **"This Firefox"** on the left sidebar.
4. Click **"Load Temporary Add-on..."**.
5. Select the `manifest.json` file from the extension folder.

---

## How to Use

1. Click the **Arnie the Eliminator** icon in your browser toolbar.
2. **Default Action:** Choose whether Arnie should `Remove` (delete from DOM) or `Hide` (`display: none`) targets by default.
3. **Custom Selectors:** Enter any CSS selectors you want to target, separated by commas (e.g., `.annoying-popup, #ad-banner, .cookie-wall`).
4. Click **Save Settings**.
5. Refresh the webpage you are on. If Arnie eliminates a target, you will see a green badge with the number of changes on the extension icon!

---

## How It Works (Under the Hood)

* **`manifest.json`**: Configures the extension. Uses a cross-browser background script setup (`"service_worker"` for Chrome, `"scripts"` for Firefox) to ensure wide compatibility.
* **`content.js`**: The main script injected into web pages. It loads user settings from `chrome.storage.local`, checks the DOM for targets, and applies the chosen action. If a target is found, it triggers the scroll fix and sends a message to the background script.
* **`background.js`**: Listens for messages from `content.js`. When targets are eliminated, it updates the extension's toolbar badge to indicate a successful hit.
* **`MutationObserver`**: Modern websites dynamically inject popups and re-apply `overflow: hidden` when you try to scroll. The observer watches the `<body>` for any DOM changes and instantly re-runs the elimination logic.

---

## Default Targets

Out of the box, Arnie targets:
* `.fc-consent-root` (Google Funding Choices / Consent Management Platform)

You can easily add more via the popup UI, or by modifying the `builtInSelectors` array in `content.js`.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (Or just feel free to use it however you like!)

---

<p align="center">
  <strong>"I need your clothes, your boots, and your motorcycle."</strong>
</p>
