/**
 * Takes a URL and returns the origin. from dollarshaveclub/postmate
 * @param  {String} url The full URL being requested
 * @return {String}     The URLs origin
 */
export function resolveOrigin(url) {
  const a = document.createElement('a');
  a.href = url;
  const protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol;
  // eslint-disable-next-line no-nested-ternary
  const host = a.host.length
    ? ((a.port === '80' || a.port === '443') ? a.hostname : a.host)
    : window.location.host;
  return a.origin || `${protocol}//${host}`;
}

export function getIframeServer(
  container,
  targetUrl,
  name,
  classListArray = []
) {
  const root = typeof container !== 'undefined' ? container : document.body;
  const origin = resolveOrigin(targetUrl);
  const frame = document.createElement('iframe');
  frame.name = name || '';
  // eslint-disable-next-line prefer-spread
  frame.classList.add.apply(frame.classList, classListArray);
  root.appendChild(frame);
  frame.src = targetUrl;
  const iframeWindow = frame.contentWindow || frame.contentDocument.parentWindow;
  return {
    server: iframeWindow,
    origin,
    frame,
    // destroy: () => { if (frame) { frame.parentNode.removeChild(frame); } }
  };
}

export function getOpenedServer(targetUrl, ...opts) {
  // window.opener.origin inaccessible when cross-origin
  const origin = resolveOrigin(targetUrl);
  const openedWindow = window.open(targetUrl, ...opts);
  return {
    server: openedWindow,
    origin,
    // destroy: () => { if (openedWindow && openedWindow.close) { openedWindow.close(); } },
  };
}

export default { resolveOrigin, getIframeServer, getOpenedServer };
