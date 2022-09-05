
async function clone() {
    const [{ id: tabId }] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = document.querySelector('#url-input').value;
    chrome.runtime.sendMessage({ type: 'clone', params: { tabId, url } });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#clone-button').addEventListener('click', clone);
});

