# postmessagejs

postmessagejs is a client-server like, WebSocket like, full Promise syntax supported postMessage library.

## why need this
* Sometimes, the server page's logic unit is not ready when Document is loaded, so we need a function to start a listening when logic unit is ready.
* Sometimes, we need waiting for the postMessage's response before post next message.

## Features
* support window: iFrame and window.open() window.
* client-server like, and WebSocket like.
* client use `callServer` to create a server (create a iframe or open a new window), then trying to connect with server unless timeout.
* server use `startListening` to start a server listening, each server listening can only connect with one client.
* es6 async await syntax supported.

## How to use it
### client
```js
import { callServer, utils } from "postmessagejs";
const { getOpenedServer, getIframeServer } = utils;
// window.open
const serverObject = getOpenedServer("/newPage");
// or iframe
const iframeRoot = document.getElementById("iframe-root");
const serverObject = getIframeServer(iframeRoot, "/newPage", "iname", ['iframe-style']);
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
  listenMessage((method, payloady, response) => {
    console.log("client listening: ", method, payloady);
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
import { startListening } from "postmessagejs";
const options = {};
startListening(options).then(e => {
  console.log("connected with client");
  const { postMessage, listenMessage, destroy } = e;
  // listener for client message
  listenMessage((method, payloady, response) => {
    console.log("server listening: ", method, payloady);
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
  const method = "testPost";
  const payload = "this is client post payload";
  postMessage(method, payload).then(e => { {
    console.log("response from client: ", e);
  });
});
```

## options 
* options : { eventFilter = (event)=>true, timeout = 20 * 1000 }
* eventFilter: is filter for post messages event.
* timeout: is set for client to connect with server, or for client and server's response of postMessage.then.
