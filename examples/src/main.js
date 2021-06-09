import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router'
import mainPage from "./pages/main-page.vue";
import iframe from "./pages/iframe.vue";
import newPage from "./pages/new-page.vue";
import mainServer from "./pages/main-server.vue";
import iframeClient from "./pages/iframe-client.vue";
import './index.less';

Vue.use(VueRouter);
const routes = [
  { path: '/', redirect: '/main' },
  { path: '/main', component: mainPage },
  { path: '/newPage', component: newPage },
  { path: '/iframe', component: iframe },
  { path: '/main-server', component: mainServer },
  { path: '/iframe-client', component: iframeClient },
];
const router = new VueRouter({
  routes,
  mode: "history"
});

Vue.config.productionTip = false;

new Vue({
  router,
  components: { 'test-root': App },
  render: h => h('test-root', {}),
}).$mount('#app');

 