# postmessagejs

postmessagejs 是一个类 client-server 模式、类 WebSocket 模式、全 Promise 语法支持的 postMessage 库。

# 为何需要这个
* 有时候，server 页面的逻辑单元并不是在 Document 加载完成后就能就绪的，所以当逻辑单元就绪时，我们需要一个方法去启动一个监听
* 有时候，我们需要等待消息的响应后才能发送下一个消息

## 特性
* 支持 iframe 和 window.open 打开的窗口
* 类 client-server 模式、类 WebSocket 模式
* client 端使用 `callServer` 方法创建一个 server (创建一个iframe或打开一个新窗口)，然后尝试连接 server 直到超时
* server 端使用 `startListening` 方法开启一个监听，一个监听只能与一个 client 建立连接
* es6 async await 语法支持

## 如何使用
```shell
$ npm i postmessagejs --save
```
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

# options
* options : { eventFilter = (event)=>true, timeout = 20 * 1000 }
* eventFilter: 对 post messages event 过滤
* timeout: 设置 client 连接 server 的超时时间, 或 client 和 server 的postMessage.then 响应超时时间

