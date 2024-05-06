# postmessage-promise

postmessage-promise is a client-server like, WebSocket like, full Promise syntax supported postMessage library.

[中文文档](./README-zh_CN.md)

## Why need this
* Sometimes, the server page's logic unit is not ready when Document is loaded, so we need a function to start a listening when logic unit is ready.
* Sometimes, we need waiting for the postMessage's response before post next message.

## Features
* postMessage().then() syntax & ES6 async/await syntax supported.
* target window: frame.contentWindow / openedWindow / window.parent / window.opener.
* client-server like, and WebSocket like.
* 3-Way Handshake at connecting.
* client use `callServer` to connect with server unless timeout. You can use the same `serverObject` to create more server-caller if necessary. (the server may be a frame.contentWindow、a new opened window、window.parent or window.opener)
* server use `startListening` to start a server listening, each server listening can only connect with one client. You can start more than one listening if necessary.
* 

### connecting
![](https://github.com/FrominXu/postmessagejs/blob/main/images/postmessagejs-connect.png?raw=true)

### message-channel
![](https://github.com/FrominXu/postmessagejs/blob/main/images/postmessagejs-message-channel.png?raw=true)

## How to use it
```shell
$ npm i postmessage-promise --save
```

## use with script tag
``` html
<script type="text/javascript" src="https://unpkg.com/postmessage-promise@3.2.0/build/postmessage-promise.umd.js"></script>
<script>
  const { startListening, callServer, utils } = postMessagePromise;
</script>
```

## start
* client call to server
```js
import { callServer, utils } from "postmessage-promise";
const serverObject = { 
  server: frame.contentWindow, // openedWindow / window.parent / window.opener; 
  origin: "*", // target-window's origin or *
};
const options = {}; 
callServer(serverObject, options).then(e => {
  const { postMessage, listenMessage, destroy } = e;
  listenMessage((method, payload, response) => {
    response("Petter's response.");
  });
  postMessage("hello", "I am Petter.").then(res => {
    postMessage("...");
  });
});
```
* server start listening
```js
import { startListening } from "postmessage-promise";
const options = {};
startListening(options).then(e => {
  const { postMessage, listenMessage, destroy } = e;
  listenMessage((method, payload, response) => {
    response("Alice's response.");
  });
  postMessage('hello', "I am Alice.").then(res => {
    postMessage("...");
  });
});
```

## serverObject
server is the target window object that you want post message to. And the origin is the target-window's origin, you can set '*' in Cross-origin case.
```js
  {
    server: frame.contentWindow, // openedWindow / window.parent / window.opener
    origin
  };
```

## options 
```js
const options = { 
  eventFilter: (event) => true, 
  timeout: 20 * 1000,
  onDestroy: () => { if (frame) { frame.parentNode.removeChild(frame); } }
}
```
* 'eventFilter' is a filter for post messages event.
* 'timeout' is set for client to connect with server, or for client and server's response of postMessage.then.

## Demo

### client (iframe case)
```js
import { callServer, utils } from "postmessage-promise";
const { getOpenedServer, getIframeServer } = utils;
const iframeRoot = document.getElementById("iframe-root");
const serverObject = getIframeServer(iframeRoot, "/targetUrl", "iname", ['iframe-style']);
const options = {}; 
callServer(serverObject, options).then(e => {
  console.log("connected with server");
  const { postMessage, listenMessage, destroy } = e;
  // post message to server and wait for response
  const method = "testPost";
  const payload = "this is client post payload";
  postMessage(method, payload).then(e => {
    console.log("response from server: ", e);
  });
  // listener for server message
  listenMessage((method, payload, response) => {
    console.log("client received: ", method, payload);
    const time = new Date().getTime();
    setTimeout(() => {
      // response to server
      response({
        time,
        msg: "this is a client response"
      });
    }, 200);
  });
});
```

### client (window.open case)
```js
import { callServer, utils } from "postmessage-promise";
const { getOpenedServer, getIframeServer } = utils;
const serverObject = getOpenedServer("/targetUrl");
const options = {}; 
callServer(serverObject, options).then(e => {
  console.log("connected with server");
  const { postMessage, listenMessage, destroy } = e;
  // post message to server and wait for response
  const method = "testPost";
  const payload = "this is client post payload";
  postMessage(method, payload).then(e => {
    console.log("response from server: ", e);
  });
  // listener for server message
  listenMessage((method, payload, response) => {
    console.log("client received: ", method, payload);
    const time = new Date().getTime();
    setTimeout(() => {
      // response to server
      response({
        time,
        msg: "this is a client response"
      });
    }, 200);
  });
});
```

### server
```js
import { startListening } from "postmessage-promise";
const options = {};
startListening(options).then(e => {
  console.log("connected with client");
  const { postMessage, listenMessage, destroy } = e;
  // listener for client message
  listenMessage((method, payload, response) => {
    console.log("server received: ", method, payload);
    const time = new Date().getTime();
    setTimeout(() => {
      // response to client
      response({
        time,
        msg: "this is a server response"
      });
    }, 200);
  });
  // post message to client and wait for response
  const method = "toClient";
  const payload = { msg: 'this is server post payload' };
  postMessage(method, payload).then(e => {
    console.log("response from client: ", e);
  });
});
```

### multiple server and client
```js
// server:
const listener = (handler, name)=>{
  startListening({
    serverInfo: {
      name: "thisIsServer"+name
    }
  }).then(e=>{
    listener(handler, Math.random());
    handler(e);
  });
}
listener((e)=>{}, 'name1');
//
// client:
callServer(serverObject, {
  onDestroy: () => { }, clientInfo: { name: "thisIsClient"+ Math.random() }
}).then(e => {})
```

