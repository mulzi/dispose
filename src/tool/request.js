// import Vue from 'vue';
import Axios from 'axios';
import store from '@/store'
// import qs from 'qs';
import { Toast } from 'vant';

/**
 * 自定义Axios实例
 */
const AJAX = Axios.create({
  baseURL: '',
  timeout: 10000,
  withCredentials: true,
});

// 添加请求拦截器
AJAX.interceptors.request.use(
  (config) => {
    //设备没有连网
    if (!navigator.onLine === true) {
      // console.log('没有网');
      setTimeout(() => {
        Toast({ forbidClick: true, icon: 'close', message: '当前网络不佳' });
      }, 1000);
    }

    if (!store.state.address) {
      store.dispatch('ethereumConnect')
    }

    // if (localStorage.getItem('tk')) {
    if (store.state.auth) {
      // config.headers.Authorization = 'Bearer ' + localStorage.getItem('tk');
      config.headers.Authorization = 'Bearer ' + store.state.auth;
    }
    if (store.state.token) {
      config.headers.token = store.state.token;
    }
    config.headers['accept-with'] = 'zh-ts';
    config.headers['x-client-req'] = 'dapp';

    return config;
  },
  (error) => {
    Toast.clear();
    // 对请求错误做些什么
    if (error && error.response) {
      console.log('err',error.response);
    }

    return Promise.reject(error);
    // return '';
  }
);

// 添加响应拦截器
AJAX.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    Toast.clear();
    if (
      error.code == 'ECONNABORTED' &&
      error.message.indexOf('timeout') != -1
    ) {
      Toast({ forbidClick: true, icon: 'close', message: '当前网络不佳' });
    }
    console.log('err', error.response)
    // 对响应错误做点什么，比如400、401、402等等
    if (error && error.response) {
      // if (error.response.data)
      Toast({
        forbidClick: true,
        icon: 'close',
        message: error.response.status + ' ' + error.response.statusText,
      });
    }

    return Promise.reject(error);
  }
);

// 定义对外Get、Post、File请求
export default {
  //ajax 不同请求方式
  _ajaxType(url, params, type) {
    type = type || 'get';
    url = url || '';
    params = params || {};
    if (url) {
      return AJAX[type](
        url,
        type == 'get'
          ? {
              params: params,
            }
          : params
      );
    }
  },

  //ajax get请求
  get(url, params) {
    return this._ajaxType(url, params);
  },

  //ajax post请求
  post(url, params) {
    // return this._ajaxType(url, qs.stringify(params), 'post');
    return this._ajaxType(url, params, 'post');
  },

  //ajax put请求
  // put(url, params) {
  //   return this._ajaxType(url, params, 'put');
  // },
  //
  // //ajax delete请求
  // delete(url, params) {
  //   return this._ajaxType(url, params, 'delete');
  // },
};
