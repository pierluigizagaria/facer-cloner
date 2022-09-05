const facerWatchfaceRegex = /https:\/\/www\.facer\.io\/watchface\/[a-zA-Z0-9]+\??.*/;
const domUrlInput = document.querySelector('#url-input');

async function clone() {
    const url = domUrlInput.value;
    if (!facerWatchfaceRegex.test(url)) {
        domUrlInput.value = '';
        return;
    }
    const [{ id: tabId }] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({ type: 'clone', params: { tabId, url } });
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#clone-button').addEventListener('click', clone);
});

