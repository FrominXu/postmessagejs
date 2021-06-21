# postmessage-promise

postmessage-promise 是一个类 client-server 模式、类 WebSocket 模式、全 Promise 语法支持的 postMessage 库。

# 为何需要这个
* 有时候，server 页面的逻辑单元并不是在 Document 加载完成后就能就绪的，所以当逻辑单元就绪时，我们需要一个方法去启动一个监听
* 有时候，我们需要等待消息的响应后才能发送下一个消息

## 特性
* 支持 iframe 和 window.open 打开的窗口
* 类 client-server 模式、类 WebSocket 模式
* client 端使用 `callServer` 方法尝试连接 server 直到超时。如果需要，你可以用同一个 `serverObject` 来创建新的 server-caller。 server 可以是 一个 frame.contentWindow、一个新打开的 window、window.parent 或者 window.opener)
* server 端使用 `startListening` 方法开启一个监听，一个监听只能与一个 client 建立连接。如果需要，你也可以开启多个监听。
* ES6 async await 语法支持

### connect
![](https://github.com/FrominXu/postmessagejs/blob/main/images/postmessagejs-connect.png?raw=true)

### message-channel
![](https://github.com/FrominXu/postmessagejs/blob/main/images/postmessagejs-message-channel.png?raw=true)

## 如何使用
```shell
$ npm i postmessage-promise --save
```

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

### 多 server 与 client 情形
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

## serverObject
你可以提供如下格式的 serverObject：
```js
  {
    server: frame.contentWindow, // openedWindow / window.parent / window.opener
    origin
  };
```

# options
```js
const options = { 
  eventFilter: (event) => true, 
  timeout: 20 * 1000,
  onDestroy: (info) => { if (frame) { frame.parentNode.removeChild(frame); } }
}
```
* eventFilter: 对 post messages event 过滤
* timeout: 设置 client 连接 server 的超时时间, 或 client 和 server 的postMessage.then 响应超时时间

