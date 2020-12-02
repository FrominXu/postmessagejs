<template>
  <div class="vue-demo-new-page">
    <t-server />
  </div>
</template>

<script>
import TServer from "./test-server.vue";
export default {
  name: "t-new-page",
  components: {
    "t-server": TServer
  }
};
</script>