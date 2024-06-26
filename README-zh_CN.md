# postmessage-promise

postmessage-promise 是一个类 client-server 模式、类 WebSocket 模式、全 Promise 语法支持的 postMessage 库。

# 为何需要这个
* 有时候，server 页面的逻辑单元并不是在 Document 加载完成后就能就绪的，所以当逻辑单元就绪时，我们需要一个方法去启动一个监听
* 有时候，我们需要等待消息的响应后才能发送下一个消息

## 特性
* postMessage().then() 语法支持和 ES6 async await 语法支持
* 支持的 window：frame.contentWindow / openedWindow / window.parent / window.opener
* 类 client-server 模式、类 WebSocket 模式
* 三次握手的连接建立实现
* client 端使用 `callServer` 方法尝试连接 server 直到超时。如果需要，你可以用同一个 `serverObject` 来创建新的 server-caller。 server 可以是 一个 frame.contentWindow、一个新打开的 window、window.parent 或者 window.opener。
* server 端使用 `startListening` 方法开启一个监听，一个监听只能与一个 client 建立连接。如果需要，你也可以开启多个监听。

### 连接流程
![](https://github.com/FrominXu/postmessagejs/blob/main/images/postmessagejs-connect.png?raw=true)

### 信息通道
![](https://github.com/FrominXu/postmessagejs/blob/main/images/postmessagejs-message-channel.png?raw=true)

## 如何使用
```shell
$ npm i postmessage-promise --save
```
## 使用 script 标签引入
``` html
<script type="text/javascript" src="https://unpkg.com/postmessage-promise@3.2.0/build/postmessage-promise.umd.js"></script>
<script>
  const { startListening, callServer, utils } = postMessagePromise;
</script>
```
## 快速开始
* client 连接 server
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
* server 启动监听
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
serverObject 是要发送消息的目标 window 对象。origin 是目标 window 的 origin，在跨域情况时可以设置为 "*"。
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
* eventFilter: 可以对 post messages 的 event 增加过滤。
* timeout: 设置 client 连接 server 的超时时间, 或 client 和 server 的 postMessage.then 响应超时时间。


## 更多示例
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

