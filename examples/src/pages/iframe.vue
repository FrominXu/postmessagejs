<template>
  <div class="vue-demo-iframe">
    <div class="iframe-client">
      <p>this is a client</p>
      <div>
        <button @click="openServer">click to create a iframe server page</button>
      </div>
      <div v-if="connected">
        <h4>connected with server success!</h4>
        <button @click="postMsg">click to post message to server</button>
      </div>
      <ul v-for="item in msgList" :key="item.time">
        <li>{{item.time}}: {{item.msg}}</li>
      </ul>
    </div>
    <div class="iframe-root-panel" id="iframe-root"></div>
  </div>
</template>

<script>
import TClient from "./test-client.vue";
import { callServer, utils } from "../../../lib";
const { getOpenedServer, getIframeServer } = utils;
export default {
  name: "t-iframe-test",
  components: { TClient },
  data: function() {
    return {
      connected: false,
      msgList: []
    };
  },
  methods: {
    openServer: function() {
      const iframeRoot = document.getElementById("iframe-root");
      const serverObject = getIframeServer(iframeRoot, "/newPage", "iname", ['iframe-style']);
      callServer(serverObject).then(e => {
        console.log("connected with server");
        this.connected = true;
        const { postMessage, listenMessage, destroy } = e;
        this.postMessage = postMessage;
        listenMessage((method, payloady, response) => {
          console.log("client listening: ", method, payloady);
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
          console.log("response from server", e);
          this.msgList = [...this.msgList, e];
        });
      }
    }
  }
};
</script>