<template>
  <div class="asset-home">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <TheHeader :title="$t('home.title')" :left-arrow="false" />
      <div class="top-deco"></div>
      <div class="title">{{ $t('home.selectRole') }}</div>
      <div class="opt-item merchant" @click="handleRole('merchant')">
        <img class="img" src="../assets/img/index/icon-merchant.png" alt="">
        <span class="role">{{ $t('home.merchant') }}</span>
      </div>
      <div class="opt-item referrer" @click="handleRole('referrer')">
        <img class="img" src="../assets/img/index/icon-merchant.png" alt="">
        <span class="role">{{ $t('home.referrer') }}</span>
      </div>
      <div class="opt-item user" @click="handleRole('user')">
        <img class="img" src="../assets/img/index/icon-merchant.png" alt="">
        <span class="role">{{ $t('home.user') }}</span>
      </div>
      <div class="coop-mail">{{ $t('home.cooperationEmail') }}</div>
    </van-pull-refresh>
  </div>
</template>

<script>
export default {
  name: '',
  components: {},
  data() {
    return {
      loading: false,
      refreshing: false,
    };
  },
  computed: {
  },
  created() {
    this.initInviter(); // 只在首页（当前页）记录邀请人地址
  },
  methods: {
    watchAddress() {},
    initInviter() {
      const inviter = this.$route.query.inviter
        ? this.$route.query.inviter
        : '0x'.padEnd(42, '0');
      this.$store.commit('setInviter', inviter);
    },
    // 下拉刷新
    onRefresh() {
      if (this.refreshing) {
        this.refreshing = false;
      }
      // 将 loading 设置为 true，表示处于加载状态
    },
    handleRole(role) {
      this.$router.push({ path: '/sub', query: { role } });
    },

    handleBack() {
      console.log('back to some url')
    }
  },
};
</script>

<style scoped>
.top-deco {
  width: 100%;
  height: 60px;
  background: #FFA600;
  border-radius: 0px 0px 60px 60px;
}
.title {
  font-size: 36px;
  font-weight: 500;
  color: #091D42;
  margin: 64px auto 46px;
}
.opt-item {
  display: flex;
  align-items: center;
  width: 594px;
  height: 240px;
  background: #fff;
  border-radius: 40px;
  margin: 0 auto 56px;
}
.opt-item .img {
  width: 120px;
  height: 120px;
  margin-left: 90px;
  margin-right: 32px;
}
.opt-item .role {
  font-size: 36px;
  font-weight: 500;
  color: #091D42;
}
.coop-mail {
  font-size: 24px;
  font-weight: 500;
  color: #ADB0CA;
  text-align: center;
  margin-bottom: 30px;
}
@media only screen and (max-width: 750px) {
  .asset-home {
    background: #fafafc;
    font-family: PingFang SC;
  }
  .van-pull-refresh {
    min-height: 100vh;
  }
}
@media only screen and (min-width: 751px) {
  .asset-home {
    background: #fafafc;
    font-family: PingFang SC;
  }
}
</style>
