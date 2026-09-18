// VIMES HIS Workstation Signing Bridge - Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('[VIMES Extension] Workstation Signing Bridge v1.2.0 installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.type === 'VIMES_AGENT_FETCH') {
    handleAgentFetch(request.payload)
      .then(result => sendResponse({ ok: true, ...result }))
      .catch(error => sendResponse({ ok: false, error: error.message || String(error) }));
    return true; // Asynchronous response
  }
  if (request && request.type === 'VIMES_CHECK_PING') {
    sendResponse({ ok: true, version: '1.2.0' });
    return false;
  }
});

async function handleAgentFetch({ url, method = 'GET', headers = {}, body = null }) {
  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => ({}));
    } else {
      responseData = await response.text().catch(() => '');
    }

    return {
      status: response.status,
      statusText: response.statusText,
      responseOk: response.ok,
      data: responseData
    };
  } catch (err) {
    throw new Error(`Không thể kết nối tới Agent qua Extension Bridge: ${err.message}`);
  }
}
