'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/* eslint-disable no-lonely-if */
var CLIENT_RESPONSE = 'client_response';
var SERVER_RESPONSE = 'server_response';
var responseMap = {
  server: {
    receive: CLIENT_RESPONSE,
    post: SERVER_RESPONSE
  },
  client: {
    receive: SERVER_RESPONSE,
    post: CLIENT_RESPONSE
  }
};
var KEY_METHODS = ['hand-shake', 'wave-hand', CLIENT_RESPONSE, SERVER_RESPONSE];
/**
 * message channel
 * type: 'server' | 'client'
 */
var MessageChannel = /*#__PURE__*/_createClass(function MessageChannel(type, messageProxy, timeout) {
  var _this = this;
  _classCallCheck(this, MessageChannel);
  _defineProperty(this, "receiveMessage", function (method, eventId, payload) {
    if (method === responseMap[_this.type].receive) {
      if (eventId && _this.messageResponse[eventId]) {
        var response = _this.messageResponse[eventId];
        delete _this.messageResponse[eventId];
        response(payload);
      }
    } else {
      // server postMessage and response
      if (_this.listener) {
        var _response = function _response(pload) {
          _this.messageProxy.request(responseMap[_this.type].post, eventId, pload);
        };
        _this.listener(method, payload, _response);
      } else {
        console.warn('no message listener: ', method, payload);
      }
    }
  });
  _defineProperty(this, "doPost", function (_ref, method, payload) {
    var resolve = _ref.resolve,
      reject = _ref.reject,
      eventId = _ref.eventId;
    _this.messageResponse[eventId] = resolve;
    try {
      _this.messageProxy.request(method, eventId, payload);
    } catch (e) {
      delete _this.messageResponse[eventId];
      reject();
      throw e;
    }
  });
  _defineProperty(this, "listenMessage", function (listener) {
    _this.listener = listener;
  });
  _defineProperty(this, "postMessage", function (method, payload) {
    if (KEY_METHODS.indexOf(method) >= 0) {
      return Promise.reject(new Error("".concat(method, " is a protected key-method.")));
    }
    return new Promise(function (resolve, reject) {
      if (_this.destroyed) {
        reject(new Error('message-channel had been destroyed!'));
        return;
      }
      var ctimer = null;
      var reswrap = function reswrap(value) {
        clearTimeout(ctimer);
        resolve(value);
      };
      var eventId = Math.random().toString().substr(3, 10);
      _this.doPost({
        resolve: reswrap,
        reject: reject,
        eventId: eventId
      }, method, payload);
      ctimer = setTimeout(function () {
        if (_this.messageResponse) {
          delete _this.messageResponse[eventId];
        }
        reject(new Error('postMessage timeout'));
      }, _this.timeout || 20 * 1000);
    });
  });
  _defineProperty(this, "destroy", function () {
    _this.destroyed = true;
    if (_this.unListen) {
      _this.unListen();
      _this.unListen = null;
    }
    _this.listener = null;
    _this.messageResponse = null;
    if (_this.messageProxy) {
      _this.messageProxy.destroy();
      _this.messageProxy = null;
    }
  });
  this.type = type;
  this.messageProxy = messageProxy;
  this.listener = null;
  this.messageResponse = {};
  this.timeout = timeout;
  this.unListen = this.messageProxy.listen(this.receiveMessage);
});

/* eslint-disable no-underscore-dangle */
var CLIENT_KEY$1 = 'postmessage-promise_client';
var SERVER_KEY = 'postmessage-promise_server';
var IDENTITY_KEY$1 = 'identity_key';
var identityMap = {
  server: {
    key: SERVER_KEY,
    accept: CLIENT_KEY$1
  },
  client: {
    key: CLIENT_KEY$1,
    accept: SERVER_KEY
  }
};
var MessageProxy = /*#__PURE__*/_createClass(function MessageProxy(type, sourceInfo, eventFilter) {
  var _this2 = this;
  _classCallCheck(this, MessageProxy);
  _defineProperty(this, "listen", function (fn) {
    var _this = _this2;
    var listener = function listener(event) {
      if (_this.origin !== '*' && event.origin !== _this.origin || event.source !== _this.source || !event.data || event.data[IDENTITY_KEY$1] !== identityMap[_this.type].accept || event.data.channelId !== _this.channelId || !_this.eventFilter(event) || !event.data.method) {
        return;
      }
      var _event$data = event.data,
        eventId = _event$data.eventId,
        method = _event$data.method,
        payload = _event$data.payload;
      fn(method, eventId, payload);
    };
    window.addEventListener('message', listener);
    return function unListen() {
      window.removeEventListener('message', listener);
    };
  });
  _defineProperty(this, "request", function (method, eventId, payload) {
    if (!_this2.source || _this2.source.closed) {
      console.error('source closed.');
      return;
    }
    _this2.source.postMessage(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, IDENTITY_KEY$1, identityMap[_this2.type].key), "channelId", _this2.channelId), "eventId", eventId), "method", method), "payload", payload), _this2.origin);
  });
  _defineProperty(this, "destroy", function () {
    _this2.type = '';
    _this2.origin = '';
    _this2.source = null;
    _this2.channelId = '';
    _this2.eventFilter = null;
  });
  this.type = type;
  var origin = sourceInfo.origin,
    source = sourceInfo.source,
    channelId = sourceInfo.channelId;
  this.origin = origin;
  this.source = source;
  this.channelId = channelId;
  this.eventFilter = eventFilter;
});

function ownKeys$1(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread$1(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys$1(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function connectServer(sourceInfo, clientProxy, timeout, clientInfo) {
  return new Promise(function (resolve, reject) {
    var server = sourceInfo.source,
      origin = sourceInfo.origin,
      channelId = sourceInfo.channelId;
    var SYN = 1;
    var ACK = 0;
    var seqnumber = Number(Math.random().toString().substr(3, 10));
    var timer = null;
    var startTime = new Date();
    var unListen = null;
    function handShake(method, eventId) {
      var payload = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      if (method === 'hand-shake') {
        // 判断状态
        var _ref = payload || {},
          sSYN = _ref.SYN,
          sACK = _ref.ACK,
          sSeq = _ref.seqnumber,
          acknumber = _ref.acknumber;
        // console.log('client hand shake', payload);
        if (sSYN === 1 && sACK === 1 && acknumber === seqnumber + 1) {
          // this is server acknowledgement
          clearInterval(timer);
          if (unListen) {
            unListen();
          }
          clientProxy.request('hand-shake', 'hand-shake-event', {
            clientInfo: clientInfo,
            ACK: 1,
            seqnumber: seqnumber + 1,
            acknumber: sSeq + 1
          });
          resolve({
            server: server,
            origin: origin,
            channelId: channelId,
            serverInfo: payload.serverInfo,
            clientInfo: clientInfo
          });
        }
      }
    }
    unListen = clientProxy.listen(handShake);
    var tryConnect = function tryConnect() {
      if (!server || server.closed) {
        clearInterval(timer);
        if (unListen) {
          unListen();
        }
        reject(new Error('server closed.'));
        throw new Error('server closed.');
      }
      if (timeout) {
        var endTime = new Date();
        var usedTime = endTime - startTime;
        if (usedTime > timeout) {
          clearInterval(timer);
          if (unListen) {
            unListen();
          }
          reject(new Error('connect timeout.'));
          throw new Error('connect timeout.');
        }
      }
      clientProxy.request('hand-shake', 'hand-shake-event', {
        clientInfo: clientInfo,
        SYN: SYN,
        ACK: ACK,
        seqnumber: seqnumber
      });
    };
    timer = setInterval(tryConnect, 100);
  });
}
/**
 * create a message channel based on the channelId.
 * @param {*} clientInfo
 */
function createChannel$1(serverProps, clientProxy, timeout) {
  var server = serverProps.server,
    _serverProps$serverIn = serverProps.serverInfo,
    serverInfo = _serverProps$serverIn === void 0 ? {} : _serverProps$serverIn,
    channelId = serverProps.channelId;
  var messageChannel = new MessageChannel('client', clientProxy, timeout);
  var destroy = function destroy() {
    if (messageChannel) {
      messageChannel.destroy();
      messageChannel = null;
    }
    if (serverProps.destroy) {
      serverProps.destroy();
    }
  };
  // daemon
  var watcher = null;
  function watch() {
    if (!server || server.closed) {
      console.info('server closed.');
      clearInterval(watcher);
      destroy();
    }
  }
  watcher = setInterval(watch, 2000);
  return {
    run: function run(resolve) {
      resolve({
        channelId: channelId,
        serverInfo: serverInfo,
        postMessage: function postMessage() {
          if (messageChannel) {
            var _messageChannel;
            return (_messageChannel = messageChannel).postMessage.apply(_messageChannel, arguments);
          }
          return Promise.reject();
        },
        listenMessage: function listenMessage() {
          if (messageChannel) {
            var _messageChannel2;
            (_messageChannel2 = messageChannel).listenMessage.apply(_messageChannel2, arguments);
          }
        },
        destroy: destroy
      });
    }
  };
}

/**
 * connect with server and create message channel
 * @param {*} serverObject
 * @param {*} options : { eventFilter, timeout } filter post messages
 */
function callServer(serverObject) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (!serverObject) throw new Error('serverObject is null');
  var server = serverObject.server,
    origin = serverObject.origin;
  var _options$eventFilter = options.eventFilter,
    eventFilter = _options$eventFilter === void 0 ? function () {
      return true;
    } : _options$eventFilter,
    _options$timeout = options.timeout,
    timeout = _options$timeout === void 0 ? 20 * 1000 : _options$timeout,
    _options$clientInfo = options.clientInfo,
    clientInfo = _options$clientInfo === void 0 ? {} : _options$clientInfo,
    onDestroy = options.onDestroy;
  var channelId = Math.random().toString().substr(3, 10);
  var sourceInfo = {
    source: server,
    origin: origin,
    channelId: channelId
  };
  return new Promise(function (resolve, reject) {
    if (!server || server.closed) {
      reject(new Error('server closed'));
      return;
    }
    var clientProxy = new MessageProxy('client', sourceInfo, eventFilter);
    connectServer(sourceInfo, clientProxy, timeout, clientInfo).then(function (sProps) {
      var serverProps = _objectSpread$1(_objectSpread$1({}, sProps), {}, {
        destroy: function destroy() {
          clientProxy = null;
          if (onDestroy) {
            onDestroy(sProps.serverInfo, sProps);
          }
        }
      });
      createChannel$1(serverProps, clientProxy, timeout).run(resolve);
    })["catch"](function (e) {
      reject(e);
    });
  });
}

function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var CLIENT_KEY = 'postmessage-promise_client';
var IDENTITY_KEY = 'identity_key';
var TCP_TIMEOUT_INIT = 1000; // RFC6298 2.1 initial RTO value
var TCP_SYNACK_RETRIES = 5;
function connectClient(eventFilter, serverInfo) {
  return new Promise(function (resolve) {
    var waitingType = 'syn'; // ack // finish
    var SYN = 1;
    var ACK = 1;
    var seqnumber = Number(Math.random().toString().substr(3, 10));
    var cSeqnumber = -1;
    var timer = null;
    var retries = TCP_SYNACK_RETRIES;
    function handShake(event) {
      if (!event.data || event.data[IDENTITY_KEY] !== CLIENT_KEY || !event.data.channelId || !event.data.method || event.data.method !== 'hand-shake' || !eventFilter(event)) {
        return;
      }
      // 判断状态
      var _ref = event.data.payload || {},
        cSYN = _ref.SYN,
        cACK = _ref.ACK,
        cSeq = _ref.seqnumber,
        cAcknumber = _ref.acknumber;
      // console.log('server hand shake', event.data, waitingType, retries);
      if (cSYN === 1 && cACK === 0) {
        if (waitingType !== 'syn') {
          return; // this is a syn timeout request
        }
        cSeqnumber = cSeq;
        // client synchronous
        waitingType = 'ack';
        var fn = function fn() {
          if (!event.source || event.source.closed) {
            console.info('client closed and reset to listening.');
            waitingType = 'syn';
            clearTimeout(timer);
            timer = null;
            retries = TCP_SYNACK_RETRIES;
            seqnumber = Number(Math.random().toString().substr(3, 10));
            cSeqnumber = -1;
            return false;
          }
          try {
            event.source.postMessage(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, IDENTITY_KEY, 'postmessage-promise_server'), "channelId", event.data.channelId), "method", 'hand-shake'), "payload", {
              serverInfo: serverInfo,
              acknumber: cSeq + 1,
              SYN: SYN,
              ACK: ACK,
              seqnumber: seqnumber
            }), event.origin);
          } catch (e) {
            console.error(e);
            return true;
          }
          return true;
        };
        var tryAck = fn();
        if (!tryAck) return;
        var retryFn = function retryFn() {
          if (retries > 0) {
            // waitingType = 'syn';
            if (waitingType === 'ack') {
              // eslint-disable-next-line operator-assignment
              retries = retries - 1;
              if (fn()) {
                timer = setTimeout(retryFn, TCP_TIMEOUT_INIT);
              }
            }
          } else {
            // reset to a new listening
            console.info('server three-way hand shake timeout and reset to listening.');
            waitingType = 'syn';
            clearTimeout(timer);
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
          var _event$data$payload = event.data.payload,
            payload = _event$data$payload === void 0 ? {} : _event$data$payload;
          resolve({
            client: event.source,
            origin: event.origin,
            channelId: event.data.channelId,
            serverInfo: serverInfo,
            clientInfo: payload.clientInfo
          });
        }
      } else ;
    }
    window.addEventListener('message', handShake);
  });
}
/**
 * create a message channel based on the channelId.
 * @param {*} clientInfo
 */
function createChannel(clientProps, eventFilter, timeout) {
  var origin = clientProps.origin,
    client = clientProps.client,
    channelId = clientProps.channelId,
    _clientProps$clientIn = clientProps.clientInfo,
    clientInfo = _clientProps$clientIn === void 0 ? {} : _clientProps$clientIn;
  var sourceInfo = {
    origin: origin,
    source: client,
    channelId: channelId
  };
  var serverProxy = new MessageProxy('server', sourceInfo, eventFilter);
  var messageChannel = new MessageChannel('server', serverProxy, timeout);
  var destroy = function destroy() {
    if (messageChannel) {
      messageChannel.destroy();
      messageChannel = null;
    }
    serverProxy = null;
    if (clientProps.destroy) {
      clientProps.destroy();
    }
  };
  // daemon
  var watcher = null;
  function watch() {
    if (!client || client.closed) {
      console.info('client closed.');
      clearInterval(watcher);
      destroy();
    }
  }
  watcher = setInterval(watch, 2000);
  return {
    run: function run(resolve) {
      resolve({
        channelId: channelId,
        clientInfo: clientInfo,
        postMessage: function postMessage() {
          if (messageChannel) {
            var _messageChannel;
            return (_messageChannel = messageChannel).postMessage.apply(_messageChannel, arguments);
          }
          return Promise.reject();
        },
        listenMessage: function listenMessage() {
          if (messageChannel) {
            var _messageChannel2;
            (_messageChannel2 = messageChannel).listenMessage.apply(_messageChannel2, arguments);
          }
        },
        destroy: destroy
      });
    }
  };
}

/**
 * start a server listening, each server listening can only connect with one client.
 * @param {*} options: { eventFilter, timeout } filter post messages
 */
function startListening() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _options$eventFilter = options.eventFilter,
    eventFilter = _options$eventFilter === void 0 ? function () {
      return true;
    } : _options$eventFilter,
    _options$timeout = options.timeout,
    timeout = _options$timeout === void 0 ? 20 * 1000 : _options$timeout,
    _options$serverInfo = options.serverInfo,
    serverInfo = _options$serverInfo === void 0 ? {} : _options$serverInfo,
    onDestroy = options.onDestroy;
  return new Promise(function (resolve) {
    connectClient(eventFilter, serverInfo).then(function (cProps) {
      var clientProps = _objectSpread(_objectSpread({}, cProps), {}, {
        destroy: function destroy() {
          if (onDestroy) {
            onDestroy(cProps.clientInfo, cProps);
          }
        }
      });
      createChannel(clientProps, eventFilter, timeout).run(resolve);
    });
  });
}

/**
 * Takes a URL and returns the origin. from dollarshaveclub/postmate
 * @param  {String} url The full URL being requested
 * @return {String}     The URLs origin
 */
function resolveOrigin(url) {
  var a = document.createElement('a');
  a.href = url;
  var protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol;
  // eslint-disable-next-line no-nested-ternary
  var host = a.host.length ? a.port === '80' || a.port === '443' ? a.hostname : a.host : window.location.host;
  return a.origin || "".concat(protocol, "//").concat(host);
}
function getIframeServer(container, targetUrl, name) {
  var classListArray = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
  var root = typeof container !== 'undefined' ? container : document.body;
  var origin = resolveOrigin(targetUrl);
  var frame = document.createElement('iframe');
  frame.name = name || '';
  // eslint-disable-next-line prefer-spread
  frame.classList.add.apply(frame.classList, classListArray);
  root.appendChild(frame);
  frame.src = targetUrl;
  var iframeWindow = frame.contentWindow || frame.contentDocument.parentWindow;
  return {
    server: iframeWindow,
    origin: origin,
    frame: frame
    // destroy: () => { if (frame) { frame.parentNode.removeChild(frame); } }
  };
}
function getOpenedServer(targetUrl) {
  var _window;
  // window.opener.origin inaccessible when cross-origin
  var origin = resolveOrigin(targetUrl);
  for (var _len = arguments.length, opts = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    opts[_key - 1] = arguments[_key];
  }
  var openedWindow = (_window = window).open.apply(_window, [targetUrl].concat(opts));
  return {
    server: openedWindow,
    origin: origin
    // destroy: () => { if (openedWindow && openedWindow.close) { openedWindow.close(); } },
  };
}
var utils = {
  resolveOrigin: resolveOrigin,
  getIframeServer: getIframeServer,
  getOpenedServer: getOpenedServer
};

var index = {
  callServer: callServer,
  startListening: startListening,
  utils: utils
};

exports.callServer = callServer;
exports["default"] = index;
exports.startListening = startListening;
exports.utils = utils;
