const API = 'https://coco-zhihu-api.onrender.com';
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'coco-next') {
    fetch(`${API}/api/next`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(message.payload)})
      .then(response => response.json()).then(sendResponse).catch(error => sendResponse({ok: false, error: error.message}));
    return true;
  }
  if (message.type === 'coco-search') {
    fetch(`${API}/api/search?q=${encodeURIComponent(message.query)}`)
      .then(response => response.json()).then(sendResponse).catch(error => sendResponse({ok: false, error: error.message}));
    return true;
  }
});
