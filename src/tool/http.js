import axios from 'axios';
import qs from 'qs';
import { Toast } from 'vant';
// import store from '../store/index';
import i18n from '@/i18n/i18n'; // 'zh-CN' : 'en-US'

const service = axios.create({
  baseURL: '',
  timeout: 100000,
  withCredentials: true,
});

const $t = i18n.messages[i18n.locale];
const whiteList = ['/user/assets/refresh', '/login']
const pending = [];
const { CancelToken } = axios;

/**
 * 处理重复请求
 * @param  {} {config}={} AxiosRequestConfig
 */
const addPending = ({ config }) => {
  // console.log(config.url, config.url.match(/login/));
  // 注意类似登录的全局接口，应该放入白名单中，不能在页面切换时取消
  const isIn = whiteList.some((url) => config.url.match(url))
  if (isIn) {
    return;
  }
  const url = `${config.url}&${config.method}&${qs.stringify(config.data)}`;
  config.cancelToken = new CancelToken((cancel) => {
    if (!pending.some((item) => item.url === url)) {
      pending.push({
        url,
        cancel,
      });
    }
  });
};

const removePending = ({ config }) => {
  const url = `${config.url}&${config.method}&${qs.stringify(config.data)}`;
  pending.forEach((item, index) => {
    if (item.url === url) {
      item.cancel(`${$t['message']['httpNeRepeat']}${config.url}`);
      pending.splice(index, 1);
    }
  });
};

/**
 * 请求头预处理
 * @param  {} {config} AxiosRequestConfig
 */
const requestHeaders = ({ config }) => {
  // 1.时间戳
  config.headers.timestamp = Date.now();
  // 2.token
  const auth = sessionStorage.getItem('auth');
  const token = sessionStorage.getItem('tk');
  if (auth) {
    config.headers.Authorization = auth;
  }
  if (token) {
    config.headers.token = token;
  }

  // 用于验证的自定义标识
  config.headers['accept-with'] = 'zh-ts';
  config.headers['x-client-req'] = 'dapp';
};

/**
 * 请求参数预处理
 * @param  {} {config}={} AxiosRequestConfig
 */
// const requestParams = ({ config } = {}) => {
//   if (['post', 'put', 'delete'].includes(config.method)) {
//     config.data = qs.stringify(config.data);
//   }
// };

/**
 * 请求开始&&loading=true
 * @param  {} requestHeaders 1.配置请求头
 * @param  {} requestParams 2.配置请求体
 * @param  {} removePending 3.处理重复请求
 */
const requestStart = ({ config } = {}) => {
  requestHeaders({ config });
  // requestParams({ config });
  removePending({ config });
  addPending({ config });
  // store.commit('setLoading', true);
};

/**
 * 请求结束&&loading=false
 * @param  {} {config}={} AxiosRequestConfig
 * @param  {} {config}={} response body
 */
const requestEnd = ({ config } = {}) => {
  removePending({ config });
  // store.commit('setLoading', false);
};

/**
 * @param  {} {status HTTP状态码
 * @param  {} data 响应体
 * @param  {} config}={} AxiosRequestConfig
 */
const responseResolve = ({ status, data, config } = {}) => {
  const { success, msg } = data;
  if (status === 200) {
    switch (success) {
      case true:
        return Promise.resolve(data);
      case false:
        return Promise.resolve(data);
      default:
        // 可配置错误提醒
        if (!config.headers['hide-message']) {
          Toast({
            forbidClick: true,
            icon: 'close',
            message: msg || $t['message']['operationFailure'], // 操作失败！
          });
        }
        return Promise.reject(data);
    }
  } else {
    Toast({
      forbidClick: true,
      icon: 'close',
      message: msg || $t['message']['operationFailure'],
    });
    // store.commit('setLoading', false);
    return Promise.reject(data);
  }
};
/**
 * 请求拦截器
 * @param  {} requestStart 请求开始
 */
service.interceptors.request.use(
  (config) => {
    if (!navigator.onLine) {
      setTimeout(() => {
        Toast({
          forbidClick: true,
          icon: 'close',
          message: $t['message']['offline'], // 当前网络不佳
        });
      }, 1000);
    }
    requestStart({ config });
    return config;
  },
  (error) => {
    Toast({
      forbidClick: true,
      icon: 'close',
      message: $t['message']['requestError'], // 请求出错
    });
    Promise.reject(error);
  },
);
/**
 * 响应拦截器
 * @param  {} requestEnd 1.请求结束
 * @param  {} responseResolve 2.请求错误处理
 */
service.interceptors.response.use(
  async (response) => {
    const { status, data, config } = response;
    requestEnd({ config, data });
    return responseResolve({ status, data, config });
  },
  (error) => {
    Toast.clear();
    if (axios.isCancel(error)) {
      // Toast.fail({ forbidClick: true, message: $t['message']['httpNeRepeat'] });
    } else {
      const { response } = error;
      if (response) {
        Toast({
          forbidClick: true,
          icon: 'close',
          message: `${response.status} ${response.statusText}`,
        });
      }
    }

    return Promise.reject(error);
  },
);

export { pending };
export default service;
