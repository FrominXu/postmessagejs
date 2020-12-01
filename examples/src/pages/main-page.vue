<template>
  <div class="vue-demo-new-page">
    <p>
      <a href="/iframe" target="_blank">open a iframe case page</a>
    </p>
    <t-client />
  </div>
</template>

<script>
import TClient from "./test-client.vue";
export default {
  name: "t-main-page",
  components: {
    "t-client": TClient
  },
  data: function() {
    return {
      opened: false
    };
  },
  methods: {
    onOpen: function() {
      this.opened = true;
    }
  }
};
</script>