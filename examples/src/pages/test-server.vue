<template>
  <div class="vue-demo-server">
    <p>this is a server. there are 3 seconds delay when server is ready.</p>
    <div v-if="connected">
      <h4>connected with client success!</h4>
      <button @click="postMsg">click to post message to client</button>
    </div>
    <div>
      <ul v-for="item in msgList" :key="item.time">
        <li>{{item.time}}: {{item.msg}}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { startListening } from "../../../lib";
export default {
  name: "t-server",
  components: {},
  data: function() {
    return {
      connected: false,
      msgList: []
    };
  },
  mounted: function() {
    // 3 seconds delay when server ready
    setTimeout(() => {
      startListening().then(e => {
        console.log("connected with client", e);
        this.connected = true;
        const { postMessage, listenMessage, destroy } = e;
        this.postMessage = postMessage;
        listenMessage((method, payload, response) => {
          console.log("server listening: ", method, payload);
          const time = new Date().getTime();
          setTimeout(() => {
            response({
              time,
              msg: "this is a server response"
            });
          }, 200);
        });
      });
    }, 3 * 1000);
  },
  methods: {
    postMsg: function() {
      if (this.postMessage) {
        this.postMessage("testPost", "this is server post payload").then(e => {
          console.log("response from client: ", e);
          this.msgList = [...this.msgList, e];
        });
      }
    }
  }
};
</script>