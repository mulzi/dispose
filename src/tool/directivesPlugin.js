export default {
  install(Vue) {
    // 使用 
    // <button v-intervalclick='{ func:执行方法, time:间隔时间(毫秒数), params:执行方法所需要的参数<> }'>点击</button>
    let isWaiting = false;
    Vue.directive('intervalclick', function(el, binding) {
      el.onclick = function() {
        if (isWaiting) return;
        isWaiting = true;
        if (!binding.value) {
          console.warn('no value');
          return;
        }
        const func = binding.value['func'];
        const time = binding.value['time'] || 350;
        if (typeof time !== 'number') {
          console.warn('no time');
          return;
        }
        const args = binding.value['params'] || [];
        setTimeout(() => {
          isWaiting = false;
        }, time || 350);
        func(...args);
      };
    });

    // 注册一个全局自定义指令 `v-focus`
    Vue.directive('focus', {
      // 当被绑定的元素插入到 DOM 中时……
      inserted: function (el) {
        // 聚焦元素
        el.focus();
      }
    });
  },
};

// 1. 注册, main.js
// import myPlugin from './myPlugin'
// Vue.use(myPlugin)
