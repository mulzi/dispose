<template>
  <div id="app" v-cloak :class="(address || $route.path == '/guide') ? address : 'disabled'" :data-v="releaseTag">
    <router-view v-if="isPc && routerState" class="pc" />
    <transition v-else :name="transitionName">  
      <router-view class="router mobile" v-if="routerState" />
    </transition>
  
    <!--钱包浏览器中打开提示弹窗-->
    <DialogDapp ref="dialogDapp" />
  </div>
</template>

<script>
import DialogDapp from '@/components/DialogDapp.vue';
import { releaseTag } from '@/api/contract';

export default {
  name: 'App',
  components: {
    DialogDapp,
  },
  provide() {
    return {
      reload: this.reload,
    };
  },
  data() {
    return {
      isPc: false,
      releaseTag,
      transitionName: '',
      routerState: true,
    };
  },
  computed: {
    address() {
      return this.$store.state.address || '';
    },
  },
  watch: {
    $route() {
      this.clearStateTimer();
      this.$toast.clear();
      const isBack = this.$router.isBack;
      if (isBack) {
        //设置动画名称
        this.transitionName = 'slide-right';
      } else {
        this.transitionName = 'slide-left';
      }

      this.$router.isBack = false;
    }
  },
  created() {
    window.addEventListener('resize', this.onResize);
    // 将当前上下文，存入store
    this.$store.commit('setAppVm', this);
    this.$store.dispatch('onAccountsChanged');
    this.$store.dispatch('onNetworkChanged');
  },
  mounted() {
    this.onResize();
    this.$toast.loading(this.$t('message.connectAdd'));
    // 连接钱包
    this.$store.dispatch('ethereumConnect');
    window.addEventListener('focus', this.onWindowFocus);
  },
  beforeDestroy() {
    window.removeEventListener('focus', this.onWindowFocus);
    window.removeEventListener('resize', this.onResize);
  },
  methods: {
    reload() {
      this.routerState = false;
      this.$nextTick(() => {
        this.routerState = true;
      });
    },
    onWindowFocus() {
    },
    onResize() {
      this.isPc = window.innerWidth > 750;
    },

    showDialog() {
      this.$refs.dialogDapp.show();
    },
  },
};
</script>

<style>

[v-cloak] {
  display: none !important;
}
#app {
  position: relative;
  font-family: PingFang, PingFang SC, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-overflow-scrolling: touch;
  /*user-select: none; !* 移动端一般会设置不可选中 *!*/
  text-align: center;
  color: #666;
  /*margin-top: 60px;*/
  width: 100%;
  /*max-width: 750px;*/
  height: 100vh;
  margin-left: auto;
  margin-right: auto;
  background: #fafafc;
  overflow-y: auto;
  transition: all 0.3s;
}
#app.disabled {
  opacity: 0.6;
}
@media screen and (min-width: 750px) {
  /* #app {
    height: unset;
  } */
  #app::-webkit-scrollbar {
    width: 6px;
    height: 16px;
    background-color: #b3a9bd;
  }
  #app::-webkit-scrollbar-thumb {
    background-color: #2f025b;
  }
}
@media only screen and (max-width: 750px) {
  /*
    这个是避免切换的时候，两个页面都是半屏显示的问题
  */
  #app {
    user-select: none;
  }
  .router {
    width: 100%;
    min-height: 100vh;
    -webkit-overflow-scrolling: touch;
  }
  .slide-right-enter-active,
  .slide-right-leave-active,
  .slide-left-enter-active,
  .slide-left-leave-active {
    will-change: transform;
    transition: all 480ms;
    position: fixed;
  }
  .slide-right-leave-to,
  .slide-right-enter {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }
  .slide-right-leave-active {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
  }
  .slide-left-leave-to,
  .slide-left-enter {
    opacity: 0;
    transform: translate3d(100%, 0, 0);
  }
  .slide-left-leave-active {
    opacity: 0;
    transform: translate3d(-100%, 0, 0);
  }
}
</style>
