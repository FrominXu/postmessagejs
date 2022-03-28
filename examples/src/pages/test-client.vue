<template>
  <div class="vue-demo-client">
    <p>this is a client</p>
    <div>
      <button @click="openServer">click to open a server page</button>
    </div>
    <div v-if="connected">
      <h4>connected with server success!</h4>
      <button @click="postMsg">click to post message to server</button>
      <div>
        <button @click="close">click to destroy server</button>
      </div>
    </div>
    <ul v-for="item in msgList" :key="item.time">
      <li>{{item.time}}: {{item.msg}}</li>
    </ul>
  </div>
</template>

<script>
import { callServer, utils } from "../../../lib";
const { getOpenedServer, getIframeServer } = utils;
export default {
  name: "t-client",
  components: {},
  data: function() {
    return {
      connected: false,
      msgList: []
    };
  },
  methods: {
    openServer: function() {
      const serverObject = getOpenedServer("/newPage");
      callServer(serverObject).then(e => {
        console.log("connected with server", e);
        this.connected = true;
        const { postMessage, listenMessage, destroy } = e;
        this.postMessage = postMessage;
        this.destroy = destroy;
        listenMessage((method, payload, response) => {
          console.log("client listening: ", method, payload);
          const time = new Date().getTime();
          setTimeout(() => {
            response({
              time,
              msg: "this is a client response"
            });
          }, 200);
        });
      });
    },
    postMsg: function() {
      if (this.postMessage) {
        this.postMessage("testPost", "this is client post payload").then(e => {
          console.log("response from server: ", e);
          this.msgList = [...this.msgList, e];
        });
      }
    },
    close: function() {
      if (this.destroy) {
        this.destroy();
        this.postMessage = null;
        this.destroy = null;
      }
    }
  }
};
</script>