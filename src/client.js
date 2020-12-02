import MessageChannel from './message-channel';
import MessageProxy from './message-proxy';

function connectServer(serverInfo, clientProxy, timeout) {
  return new Promise((resolve, reject) => {
    const { source: server } = serverInfo;
    let timer = null;
    const startTime = new Date();
    let unListen = null;
    function handShake(method) {
      if (method === 'hand-shake') {
        clearInterval(timer);
        if (unListen) { unListen(); }
        resolve();
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
      clientProxy.request('hand-shake', 'hand-shake-event', {});
    };
    timer = setInterval(tryConnect, 100);
  });
}
/**
 * create a message channel based on the channelId.
 * @param {*} clientInfo
 */
function createChannel(serverInfo, clientProxy, timeout) {
  const { source: server } = serverInfo;
  let messageChannel = new MessageChannel('client', clientProxy, timeout);
  const destroy = () => {
    if (messageChannel) {
      messageChannel.destroy();
      messageChannel = null;
    }
    if (serverInfo.destroy) { serverInfo.destroy(); }
  };
  // daemon
  let watcher = null;
  function watch() {
    if (!server || server.closed) {
      console.info('server closed.');
      clearInterval(watcher);
      if (messageChannel) {
        messageChannel.destroy();
      }
    }
  }
  watcher = setInterval(watch, 1000);
  return {
    run: resolve => {
      resolve({
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
  const { server, origin, destroy } = serverObject;
  const { eventFilter = () => true, timeout = 20 * 1000 } = options;
  const channelId = Math.random().toString().substr(3, 10);
  const serverInfo = {
    source: server, origin, channelId, destroy
  };
  return new Promise((resolve, reject) => {
    if (!server || server.closed) {
      reject(new Error('server closed'));
      return;
    }
    let clientProxy = new MessageProxy('client', serverInfo, eventFilter);
    const sInfo = {
      ...serverInfo,
      destroy: () => {
        if (destroy) {
          destroy();
          clientProxy = null;
        }
      }
    };
    connectServer(serverInfo, clientProxy, timeout).then(() => {
      createChannel(sInfo, clientProxy, timeout).run(resolve);
    }).catch(e => {
      reject(e);
    });
  });
}

export default callServer;
