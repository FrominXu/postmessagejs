import MessageChannel from './message-channel';
import MessageProxy from './message-proxy';

function connectServer(sourceInfo, clientProxy, timeout, clientInfo) {
  return new Promise((resolve, reject) => {
    const { source: server, origin, channelId } = sourceInfo;
    const SYN = 1;
    const ACK = 0;
    const seqnumber = Number(Math.random().toString().substr(3, 10));
    let timer = null;
    const startTime = new Date();
    let unListen = null;
    function handShake(method, eventId, payload = {}) {
      if (method === 'hand-shake') {
        // 判断状态
        const {
          SYN: sSYN, ACK: sACK, seqnumber: sSeq, acknumber
        } = payload || {};
        // console.log('client hand shake', payload);
        if (sSYN === 1 && sACK === 1 && acknumber === seqnumber + 1) {
          // this is server acknowledgement
          clearInterval(timer);
          if (unListen) { unListen(); }
          clientProxy.request('hand-shake', 'hand-shake-event', {
            clientInfo, ACK: 1, seqnumber: seqnumber + 1, acknumber: sSeq + 1,
          });
          resolve({
            server,
            origin,
            channelId,
            serverInfo: payload.serverInfo,
            clientInfo
          });
        }
      }
    }
    unListen = clientProxy.listen(handShake);
    const tryConnect = () => {
      if (!server || server.closed) {
        clearInterval(timer);
        if (unListen) { unListen(); }
        reject(new Error('server closed.'));
        throw new Error('server closed.');
      }
      if (timeout) {
        const endTime = new Date();
        const usedTime = endTime - startTime;
        if (usedTime > timeout) {
          clearInterval(timer);
          if (unListen) { unListen(); }
          reject(new Error('connect timeout.'));
          throw new Error('connect timeout.');
        }
      }
      clientProxy.request('hand-shake', 'hand-shake-event', {
        clientInfo, SYN, ACK, seqnumber
      });
    };
    timer = setInterval(tryConnect, 100);
  });
}
/**
 * create a message channel based on the channelId.
 * @param {*} clientInfo
 */
function createChannel(serverProps, clientProxy, timeout) {
  const { server, serverInfo = {}, channelId } = serverProps;
  let messageChannel = new MessageChannel('client', clientProxy, timeout);
  const destroy = () => {
    if (messageChannel) {
      messageChannel.destroy();
      messageChannel = null;
    }
    if (serverProps.destroy) { serverProps.destroy(); }
  };
  // daemon
  let watcher = null;
  function watch() {
    if (!server || server.closed) {
      console.info('server closed.');
      clearInterval(watcher);
      destroy();
    }
  }
  watcher = setInterval(watch, 2000);
  return {
    run: resolve => {
      resolve({
        channelId,
        serverInfo,
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
        destroy,
      });
    }
  };
}

/**
 * connect with server and create message channel
 * @param {*} serverObject
 * @param {*} options : { eventFilter, timeout } filter post messages
 */
function callServer(serverObject, options = {}) {
  if (!serverObject) throw new Error('serverObject is null');
  const { server, origin } = serverObject;
  const {
    eventFilter = () => true, timeout = 20 * 1000, clientInfo = {}, onDestroy
  } = options;
  const channelId = Math.random().toString().substr(3, 10);
  const sourceInfo = {
    source: server, origin, channelId
  };
  return new Promise((resolve, reject) => {
    if (!server || server.closed) {
      reject(new Error('server closed'));
      return;
    }
    let clientProxy = new MessageProxy('client', sourceInfo, eventFilter);
    connectServer(sourceInfo, clientProxy, timeout, clientInfo).then(sProps => {
      const serverProps = {
        ...sProps,
        destroy: () => {
          clientProxy = null;
          if (onDestroy) {
            onDestroy(sProps.serverInfo, sProps);
          }
        }
      };
      createChannel(serverProps, clientProxy, timeout).run(resolve);
    }).catch(e => {
      reject(e);
    });
  });
}

export default callServer;
