import MessageChannel from './message-channel';
import MessageProxy from './message-proxy';

const CLIENT_KEY = 'postmessage-promise_client';
const IDENTITY_KEY = 'identity_key';
const TCP_TIMEOUT_INIT = 1000; // RFC6298 2.1 initial RTO value
const TCP_SYNACK_RETRIES = 5;
function connectClient(eventFilter, serverInfo) {
  return new Promise(resolve => {
    let waitingType = 'syn'; // ack // finish
    const SYN = 1;
    const ACK = 1;
    let seqnumber = Number(Math.random().toString().substr(3, 10));
    let cSeqnumber = -1;
    let timer = null;
    let retries = TCP_SYNACK_RETRIES;
    function handShake(event) {
      if (!event.data
        || event.data[IDENTITY_KEY] !== CLIENT_KEY
        || !event.data.channelId
        || !event.data.method
        || event.data.method !== 'hand-shake'
        || !eventFilter(event)) {
        return;
      }
      // 判断状态
      const {
        SYN: cSYN, ACK: cACK, seqnumber: cSeq, acknumber: cAcknumber
      } = event.data.payload || {};
      // console.log('server hand shake', event.data, waitingType, retries);
      if (cSYN === 1 && cACK === 0) {
        if (waitingType !== 'syn') {
          return; // this is a syn timeout request
        }
        cSeqnumber = cSeq;
        // client synchronous
        waitingType = 'ack';
        const fn = () => {
          event.source.postMessage({
            [IDENTITY_KEY]: 'postmessage-promise_server',
            channelId: event.data.channelId,
            method: 'hand-shake',
            payload: {
              serverInfo,
              acknumber: cSeq + 1,
              SYN,
              ACK,
              seqnumber
            }
          }, event.origin);
        };
        fn();
        const retryFn = () => {
          if (retries > 0) {
            // eslint-disable-next-line operator-assignment
            retries = retries - 1;
            // waitingType = 'syn';
            if (waitingType === 'ack') {
              fn();
            }
            timer = setTimeout(retryFn, TCP_TIMEOUT_INIT);
          } else {
            // reset to a new listening
            console.info('server three-way hand shake timeout and reset to listening.');
            waitingType = 'syn';
            timer = null;
            retries = TCP_SYNACK_RETRIES;
            seqnumber = Number(Math.random().toString().substr(3, 10));
            cSeqnumber = -1;
          }
        };
        // TCP_TIMEOUT_INIT: waiting for the third hand shake until timeout.
        if (!timer) {
          timer = setTimeout(retryFn, TCP_TIMEOUT_INIT);
        }
      } else if (waitingType === 'ack') {
        if (cACK === 1 && cSeq === cSeqnumber + 1 && cAcknumber === seqnumber + 1) {
          // waiting for the third hand shake.
          waitingType = 'finish';
          clearTimeout(timer);
          timer = null;
          // client acknowledgement
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
      } else {
        // this is a ack timeout request
      }
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
    origin, client, channelId, clientInfo = {}
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
      resolve({
        channelId,
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
