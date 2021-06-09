import MessageChannel from './message-channel';
import MessageProxy from './message-proxy';

const CLIENT_KEY = 'postmessage-promise_client';
const IDENTITY_KEY = 'identity_key';
function connectClient(eventFilter, serverInfo) {
  return new Promise(resolve => {
    function handShake(event) {
      if (!event.data
        || event.data[IDENTITY_KEY] !== CLIENT_KEY
        || !event.data.channelId
        || !event.data.method
        || event.data.method !== 'hand-shake'
        || !eventFilter(event)) {
        return;
      }
      window.removeEventListener('message', handShake);
      const { payload = {} } = event.data;
      resolve({
        client: event.source,
        origin: event.origin,
        channelId: event.data.channelId,
        serverInfo,
        clientInfo: payload.clientInfo
      });
    }
    window.addEventListener('message', handShake);
  });
}
/**
 * create a message channel based on the channelId.
 * @param {*} clientInfo
 */
function createChannel(clientProps, eventFilter, timeout) {
  const {
    origin, client, channelId, serverInfo = {}, clientInfo = {}
  } = clientProps;
  const sourceInfo = { origin, source: client, channelId };
  let serverProxy = new MessageProxy('server', sourceInfo, eventFilter);
  let messageChannel = new MessageChannel('server', serverProxy, timeout);
  const destroy = () => {
    if (messageChannel) {
      messageChannel.destroy();
      messageChannel = null;
    }
    serverProxy = null;
    if (clientProps.destroy) { clientProps.destroy(); }
  };
  // daemon
  let watcher = null;
  function watch() {
    if (!client || client.closed) {
      console.info('client closed.');
      clearInterval(watcher);
      destroy();
    }
  }
  watcher = setInterval(watch, 2000);
  return {
    run: resolve => {
      serverProxy.request('hand-shake', 'hand-shake-event', { serverInfo });
      resolve({
        clientInfo,
        postMessage: (...args) => {
          if (messageChannel) {
            return messageChannel.postMessage(...args);
          }
          return Promise.reject();
        },
        listenMessage: (...args) => {
          if (messageChannel) {
            messageChannel.listenMessage(...args);
          }
        },
        destroy
      });
    }
  };
}

/**
 * start a server listening, each server listening can only connect with one client.
 * @param {*} options: { eventFilter, timeout } filter post messages
 */
function startListening(options = {}) {
  const {
    eventFilter = () => true, timeout = 20 * 1000, serverInfo = {}, onDestroy
  } = options;
  return new Promise(resolve => {
    connectClient(eventFilter, serverInfo).then(cProps => {
      const clientProps = {
        ...cProps,
        destroy: () => {
          if (onDestroy) {
            onDestroy(cProps.clientInfo);
          }
        }
      };
      createChannel(clientProps, eventFilter, timeout).run(resolve);
    });
  });
}

export default startListening;
