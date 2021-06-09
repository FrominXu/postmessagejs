<template>
  <div class="vue-demo-main-server">
    <p>this is a server</p >
    <div>
      <button @click="createIframe">click to create a iframe client page</button>
    </div>
    <div v-if="connected">
      <h4>connected with client success!</h4>
      <button @click="postMsg">click to post message to client</button>
    </div>
    <div>
      <ul v-for="item in msgList" :key="item.time">
        <li>{{ item.time }}: {{ item.msg }}</li>
      </ul>
    </div>
    <div class="iframe-root-panel" v-for="item in iframes" v-bind:key="item.id" :id="item.id"></div>
  </div>
</template>

<script>
import { startListening } from "../../../lib";
import { callServer, utils } from "../../../lib";
const { getOpenedServer, getIframeServer } = utils;
export default {
  name: "t-server",
  components: {},
  data: function () {
    return {
      connected: false,
      iframes:[],
      msgList: [],
    };
  },
  mounted: function () {
    const handler = (e) => {
      this.connected = true;
        const { postMessage, listenMessage, destroy, clientInfo } = e;
        console.log("connected with client:", clientInfo.name);
        this.postMessage = postMessage;
        listenMessage((method, payload, response) => {
          console.log("server listening: ", method, payload);
          const time = new Date().getTime();
          setTimeout(() => {
            response({
              time,
              msg: "this is a server response",
            });
          }, 200);
        });
      };
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
    // 3 seconds delay when server ready
    setTimeout(() => {
      listener(handler, Math.random());
    }, 1000);
  },
  methods: {
    createIframe: function () {
      const newItem = {
        id: Math.random().toString().substring(3,8)
      };
      this.iframes=[...this.iframes, newItem];
      setTimeout(() => {        
        const iframeRoot = document.getElementById(newItem.id);
        const clientObject = getIframeServer(iframeRoot, "/iframe-client", "iname", [
          "iframe-style",
        ]);
      }, 100);
    },
    postMsg: function () {
      if (this.postMessage) {
        this.postMessage("testPost", "this is server post payload").then(
          (e) => {
            console.log("response from client: ", e);
            this.msgList = [...this.msgList, e];
          }
        );
      }
    },
  },
};
</script>