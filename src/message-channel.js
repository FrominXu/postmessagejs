/* eslint-disable no-lonely-if */
const CLIENT_RESPONSE = 'client_response';
const SERVER_RESPONSE = 'server_response';
const responseMap = {
  server: { receive: CLIENT_RESPONSE, post: SERVER_RESPONSE },
  client: { receive: SERVER_RESPONSE, post: CLIENT_RESPONSE },
};
/**
 * message channel
 * type: 'server' | 'client'
 */
class MessageChannel {
  constructor(type, messageProxy, timeout) {
    this.type = type;
    this.messageProxy = messageProxy;
    this.listener = null;
    this.messageResponse = {};
    this.timeout = timeout;
    this.unListen = this.messageProxy.listen(this.receiveMessage);
  }

  receiveMessage = (method, eventId, payload) => {
    if (method === responseMap[this.type].receive) {
      if (eventId && this.messageResponse[eventId]) {
        const response = this.messageResponse[eventId];
        delete this.messageResponse[eventId];
        response(payload);
      }
    } else {
      // server postMessage and response
      if (this.listener) {
        const response = pload => {
          this.messageProxy.request(responseMap[this.type].post, eventId, pload);
        };
        this.listener(method, payload, response);
      } else {
        console.warn('no message listener: ', method, payload);
      }
    }
  }

  doPost = ({ resolve, reject, eventId }, method, payload) => {
    this.messageResponse[eventId] = resolve;
    try {
      this.messageProxy.request(method, eventId, payload);
    } catch (e) {
      delete this.messageResponse[eventId];
      reject();
      throw e;
    }
  };

  listenMessage = listener => {
    this.listener = listener;
  }

  postMessage = (method, payload) => {
    return new Promise((resolve, reject) => {
      if (this.destroyed) {
        reject(new Error('message-channel had been destroyed!'));
        return;
      }
      let ctimer = null;
      const reswrap = value => {
        clearTimeout(ctimer);
        resolve(value);
      };
      const eventId = Math.random().toString().substr(3, 10);
      this.doPost({
        resolve: reswrap, reject, eventId
      }, method, payload);
      ctimer = setTimeout(() => {
        delete this.messageResponse[eventId];
        reject(new Error('postMessage timeout'));
      }, this.timeout || (20 * 1000));
    });
  }

  destroy = () => {
    this.destroyed = true;
    this.unListen();
    this.listener = null;
    this.messageResponse = null;
    this.messageProxy.destroy();
    this.messageProxy = null;
  }
}

export default MessageChannel;
