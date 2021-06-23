import Vue from 'vue';
import Vuex from 'vuex';
import Cookies from 'js-cookie';
import { login, loginFront } from '@/api/user';
import { cookieDomain } from '@/api/contract';
import { Locale, Toast } from 'vant';
import i18n from '@/i18n/i18n'; // 'zh-CN' : 'en-US'
// import asset from './modules/asset'
// import ros from './modules/ros'
// import error from './modules/error'
import { addError } from '../api/user';

Vue.use(Vuex)

// 使用require.context 实现自动挂载modules文件夹内的文件
// // https://webpack.js.org/guides/dependency-management/#requirecontext
const modulesFiles = require.context('./modules', true, /\.js$/)
// you do not need `import app from './modules/app'`
// it will auto require all vuex module from modules file
const modules = modulesFiles.keys().reduce((modules, modulePath) => {
  // set './app.js' => 'app'
  const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1')
  const value = modulesFiles(modulePath)
  modules[moduleName] = value.default
  return modules
}, {})

const store = new Vuex.Store({
  // modules: {
  //   ros,
  //   asset,
  //   error,
  // },
  modules,
  state: {
    language: 'en-US',
    appVm: null, // 持有app组件引用
    isShowGuide: !localStorage.getItem('gd'),
    isGoBought: !localStorage.getItem('bt'),
    inviter: localStorage.getItem('inviter'), // 邀请者的地址
    address: '',
    token: '',
    auth: '',
    chainId: '',
    bought: localStorage.getItem('bought') == 'true', // string: 是否已经认购, true已认购首页 /index2, false未认购 /falco
    isSealing: localStorage.getItem('sealing') === 'sealing', // boolean: true or false
    unreadNum: 0, // 未读消息数量
    btcList: null, // btc 价格列表
    btcTimestamp: null, // btc 最小日期时间戳
    rewardDeadline: '2021/07/20', // FIXME:奖励有效期
    falcoOpenTime: new Date(2031, 3, 26).getTime(), // 默认 2031-04-26
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
    setToken(state, token) {
      state.token = token;
      sessionStorage.setItem('tk', token);
    },
    setAuthorization(state, token) {
      state.auth = token;
      sessionStorage.setItem('auth', token);
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
    setIsShowGuide(state, isShow = false) {
      state.isShowGuide = isShow;
      localStorage.setItem('gd', isShow ? '' : 'no');
    },
    // 是否封仓
    setIsSealing(state, isSealing = false) {
      state.isSealing = isSealing;
      localStorage.setItem('sealing', isSealing ? 'sealing' : 'false');
    },
    setIsBuy(state, isBuy) {
      state.bought = isBuy;
      localStorage.setItem('bought', isBuy);
    },
    setUnreadNum(state, num) {
      state.unreadNum = num;
    },
    setFalcoOpenTime(state, timestamp) {
      state.falcoOpenTime = timestamp;
    },
    SET_BTC_LIST(state, list = []) {
      state.btcList = list;
    },
    SET_BTC_TIMESTAMP(state, time) {
      state.btcTimestamp = time;
    }
  },
  actions: {
    async addError({ dispatch, state }, error) {
      try {
        error.time = Date.now();
        const params = {
          address: state.address,
          time: Date.now(),
          error: JSON.stringify(error),
        };
        dispatch('error/addErrorLog', params);
        const { success, msg } = await addError(params);
        console.log(success, msg);
      } catch (error) {
        console.warn(error);
      }
    },
    async reqAuthorization({ commit, state }) {
      try {
        if (!state.address) {
          console.warn('no address');
          return;
        }
        const params = { address: state.address };
        const { success, data } = await login(params);
        if (success && data) {
          commit('setAuthorization', data.token);
        } else {
          Toast.fail(i18n.messages[i18n.locale]['message']['tokenFail']);
        }
      } catch (error) {
        console.log(error);
      }
    },
    async reqToken({ commit, state }) {
      try {
        if (!state.address) {
          console.warn('no address');
          return;
        }
        const params = { address: state.address, account: 'front', password: '21A63c985080' };
        const { success, data } = await loginFront(params);
        if (success && data) {
          commit('setToken', data);
        } else {
          Toast.fail(i18n.messages[i18n.locale]['message']['tokenFail']);
        }
      } catch (error) {
        console.log(error);
      }
    },
    async ethereumConnect({ commit, state }) {
      if (!window.ethereum) {
        state.appVm.showDialog();
        return;
      }
      // 触发watch，置空
      commit('setAddress', '');
      commit('setToken', '');
      commit('setAuthorization', '');
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
          commit('setToken', '');
          commit('setAuthorization', '');
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
