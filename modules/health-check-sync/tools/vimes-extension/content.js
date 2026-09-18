// VIMES HIS Workstation Signing Bridge - Content Script
(function () {
  const EXTENSION_VERSION = '1.2.0';

  // Mark DOM element attribute so web page can synchronously detect extension
  try {
    document.documentElement.setAttribute('data-vimes-extension-ready', EXTENSION_VERSION);
  } catch (e) { }

  // Inject a small script to set window flag in page context
  const script = document.createElement('script');
  script.textContent = `window.__VIMES_AGENT_EXTENSION__ = { version: '${EXTENSION_VERSION}', ready: true };`;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // Listen for messages from web application
  window.addEventListener('message', function (event) {
    if (!event.data || event.data.source !== 'VIMES_HIS_PAGE') return;

    if (event.data.type === 'VIMES_PING') {
      window.postMessage({
        source: 'VIMES_EXTENSION_BRIDGE',
        type: 'VIMES_PONG',
        requestId: event.data.requestId,
        version: EXTENSION_VERSION
      }, '*');
      return;
    }

    if (event.data.type === 'VIMES_AGENT_REQUEST') {
      const { requestId, payload } = event.data;
      const headers = Object.assign({}, payload?.headers || {}, {
        'X-Agent-Origin': window.location.origin
      });
      const enrichedPayload = Object.assign({}, payload, { headers });
      chrome.runtime.sendMessage(
        { type: 'VIMES_AGENT_FETCH', payload: enrichedPayload },
        function (response) {
          window.postMessage({
            source: 'VIMES_EXTENSION_BRIDGE',
            type: 'VIMES_AGENT_RESPONSE',
            requestId: requestId,
            payload: response
          }, '*');
        }
      );
    }
  });

  console.log(`[VIMES Extension] Content script v${EXTENSION_VERSION} active.`);
})();
