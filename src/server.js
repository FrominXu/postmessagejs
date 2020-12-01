import MessageChannel from './message-channel';
import MessageProxy from './message-proxy';

const CLIENT_KEY = 'postmessagejs_client';
const IDENTITY_KEY = 'identity_key';
function connectClient(eventFilter) {
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
      resolve({
        client: event.source,
        origin: event.origin,
        channelId: event.data.channelId,
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
  const { origin, client, channelId } = clientProps;
  const clientInfo = { origin, source: client, channelId };
  const serverProxy = new MessageProxy('server', clientInfo, eventFilter);
  const messageChannel = new MessageChannel('server', serverProxy, timeout);
  return {
    run: resolve => {
      serverProxy.request('hand-shake', 'hand-shake-event', {});
      resolve({
        postMessage: messageChannel.postMessage,
        listenMessage: messageChannel.listenMessage,
        destroy: messageChannel.destroy,
      });
    }
  };
}

/**
 * start a server listening, each server listening can only connect with on client.
 * @param {*} options: { eventFilter, timeout } filter post messages
 */
function startListening(options = {}) {
  const { eventFilter = () => true, timeout = 20 * 1000 } = options;
  return new Promise(resolve => {
    connectClient(eventFilter).then(clientProps => {
      createChannel(clientProps, eventFilter, timeout).run(resolve);
    });
  });
}

export default startListening;
