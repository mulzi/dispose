import Web3 from 'web3';
import { web3Url, tsrAddress } from '@/api/contract';
import { tsrABI } from '@/api/tsrABI';


if (typeof window.ethereum != 'undefined') {
  // console.log('我已获得以太坊授权')
  window.web3 = new Web3(window.ethereum);
} else {
  window.web3 = new Web3(new Web3.providers.HttpProvider(web3Url));
}

export const web3 = window.web3;
export const tsrContract = new window.web3.eth.Contract(
  tsrABI,
  tsrAddress
);

export default {
  install(Vue) {
    /**
     * 挂载到原型链上
     */
    Object.defineProperty(Vue.prototype, '$web3', {
      get() {
        return web3;
      },
    });
    
    Object.defineProperty(Vue.prototype, '$tsrContract', {
      get() {
        return tsrContract;
      },
    });
  }
}
