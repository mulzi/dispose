import Vue from 'vue'
import contractPlugin from '@/tool/contractPlugin';
import directivesPlugin from '@/tool/directivesPlugin';
import mixinPlugin from '@/tool/watchPlugin';
import TheHeader from '@/components/TheHeader.vue';
import '@/tool/vantConfig';
import Copy from 'vue-to-copy';
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n/i18n'; //引入语言包文件
import "lib-flexible/flexible.js";
import '@/style/index.css';
import VueApollo from 'vue-apollo';
import { apolloClient } from '@/tool/apolloClient';

Vue.use(VueApollo)
Vue.use(contractPlugin);
Vue.use(directivesPlugin);
Vue.use(mixinPlugin);
Vue.use(Copy);
Vue.component('TheHeader', TheHeader);

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

Vue.config.productionTip = false;


/**
 * 页面中使用回退，this.MyGo(-1);
 * 对于需要回退到指定页面，需要在路由跳转前，手动设置 this.$router.isBack = true;
 * @param {*} num 默认-1，用于回退上一页
 */
Vue.prototype.MyGo = (num = -1) => {
  router.isBack = true;
  router.go(num);
};

new Vue({
  router,
  store,
  i18n,
  // inject apolloProvider here like vue-router or vuex
  apolloProvider,
  render: h => h(App),
}).$mount('#app');
