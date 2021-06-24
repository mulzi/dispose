import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { Locale } from 'vant';
import { cookieDomain, defaultLanguage } from '@/api/contract';
import messages from './lang';
import Cookies from 'js-cookie';

Vue.use(VueI18n);

// ['en-US', 'zh-CN']
let initLang = '';
// const ckLang = Cookies.get('lang');
const ckLang = 'zh-CN';
// 从localStorage获取语言选择
// if (['en-US', 'zh-CN'].includes(localStorage.lang)) {
//   initLang = localStorage.lang;

if (['en-US', 'zh-CN'].includes(ckLang)) {
  initLang = ckLang;
} else {
  initLang = defaultLanguage; // 默认为英文
  localStorage.setItem('lang', initLang);
  Cookies.set('lang', initLang, {
    expires: 100,
    path: '/',
    domain: cookieDomain,
  })
}

document.documentElement.lang = initLang;

// Vant初始语言设置
Locale.use(initLang, messages[initLang]);
const i18n = new VueI18n({
  locale: initLang, // 本地初始语言设置
  messages,
});

export default i18n;
