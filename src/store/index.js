import Vue from 'vue';
import Vuex from 'vuex';
import Cookies from 'js-cookie';
import { cookieDomain } from '@/api/contract';
import { Locale, Toast } from 'vant';
import i18n from '@/i18n/i18n'; // 'zh-CN' : 'en-US'

Vue.use(Vuex)


const store = new Vuex.Store({
  state: {
    language: 'en-US',
    appVm: null, // 持有app组件引用
    isShowGuide: !localStorage.getItem('gd'),
    inviter: localStorage.getItem('inviter'), // 邀请者的地址
    address: '',
    chainId: '',
  },
  mutations: {
    setAppVm(state, vm) {
      state.appVm = vm;
    },
    setInviter(state, address) {
      state.inviter = address;
      localStorage.setItem('inviter', address);
    },
    setChainId(state, chainId) {
      state.chainId = String(chainId);
      localStorage.setItem('chainId', chainId);
    },
    setAddress(state, address) {
      state.address = address;
      localStorage.setItem('address', address);
    },
    setLanguage(state, lang = 'en-US') {
      state.language = lang;
      i18n.locale = lang;
      Locale.use(lang, i18n.messages[lang]);
      document.documentElement.lang = lang;
      localStorage.setItem('lang', lang);
      Cookies.set('lang', lang, {
        expires: 100,
        path: '/',
        domain: cookieDomain,
      });
    },
  },
  actions: {
    async ethereumConnect({ commit, state }) {
      if (!window.ethereum) {
        state.appVm.showDialog();
        return;
      }
      // 触发watch，置空
      commit('setAddress', '');
      try {
        // 请求帐户访问
        let acc;
        if (typeof window.ethereum.enable === 'function') {
          acc = await window.ethereum.enable();
        } else {
          acc = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        // Log available accounts
        // const acc = await window.ethereum.request({ method: 'eth_accounts' })
        if (acc && acc[0]) {
          commit('setAddress', acc[0]);
          Toast.clear();
        } else {
          // 连接钱包失败
          Toast.clear();
          Toast.fail(i18n.messages[i18n.locale]['message']['connectError']);
        }
      } catch (error) {
        if (error.code === 4001) {
          // EIP-1193 userRejectedRequest error
          // If this happens, the user rejected the connection request.
          console.log('Please connect to account');
        } else {
          console.error(error);
        }
        Toast.clear();
        Toast.fail(i18n.messages[i18n.locale]['message']['connectError']);
      }
    },
    // 监听account 变化
    async onAccountsChanged({ commit, state }) {
      if (!window.ethereum) {
        // 请在钱包中浏览当前页面
        state.appVm.showDialog();
        return
      }
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts && accounts[0]) {
          commit('setAddress', accounts[0]);
        } else {
          commit('setAddress', '');
          // 连接钱包失败
          Toast.fail(i18n.messages[i18n.locale]['message']['connectError']);
        }
      });
    },
    // 监听network 变化
    async onNetworkChanged({ dispatch, state }) {
      if (!window.ethereum) {
        state.appVm.showDialog();
        return;
      }
      window.ethereum.on('chainChanged', (chainId) => {
        if (chainId) {
          dispatch('ethereumConnect');
        }
      });
    },
    showShareQR({ state }) {
      state.appVm.showQR();
    },
  },
})

export default store;
