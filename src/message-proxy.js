/* eslint-disable no-underscore-dangle */
const CLIENT_KEY = 'postmessagejs_client';
const SERVER_KEY = 'postmessagejs_server';
const IDENTITY_KEY = 'identity_key';
const identityMap = {
  server: { key: SERVER_KEY, accept: CLIENT_KEY },
  client: { key: CLIENT_KEY, accept: SERVER_KEY }
};
class MessageProxy {
  constructor(type, sourceInfo, eventFilter) {
    this.type = type;
    const { origin, source, channelId } = sourceInfo;
    this.origin = origin;
    this.source = source;
    this.channelId = channelId;
    this.eventFilter = eventFilter;
  }

  listen = fn => {
    const _this = this;
    const listener = function listener(event) {
      if (event.origin !== _this.origin
        || event.source !== _this.source
        || !event.data
        || event.data[IDENTITY_KEY] !== identityMap[_this.type].accept
        || event.data.channelId !== _this.channelId
        || !_this.eventFilter(event)
        || !event.data.method) {
        return;
      }
      const { eventId, method, payload } = event.data;
      fn(method, eventId, payload);
    };
    window.addEventListener('message', listener);
    return function unListen() {
      window.removeEventListener('message', listener);
    };
  }

  request = (method, eventId, payload) => {
    if (!this.source || this.source.closed) {
      console.error('source closed.');
      return;
    }
    this.source.postMessage({
      [IDENTITY_KEY]: identityMap[this.type].key,
      channelId: this.channelId,
      eventId,
      method,
      payload
    }, this.origin);
  }

  destroy = () => {
    this.type = '';
    this.origin = '';
    this.source = null;
    this.channelId = '';
    this.eventFilter = null;
  }
}

export default MessageProxy;
