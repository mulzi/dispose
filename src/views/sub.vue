<template>
  <div class="role-wrapper">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <TheHeaderSub :title="$t('home.title')" />
      <div class="top-deco"></div>
      <router-view class="content" ref="subView" :refreshing="refreshing" />
    </van-pull-refresh>
    <!-- <div class="to-merchant" v-if="['/user', '/referrer'].includes($route.path)">
      <div class="btn" @click="goToMerchant">
        <span>{{ $t('home.toMerchant') }}</span>
        <van-icon name="arrow" />
      </div>
    </div> -->
  </div>
</template>

<script>
import TheHeaderSub from '@/components/TheHeaderSub.vue';

export default {
  components: {
    TheHeaderSub,
  },
  data() {
    return {
      loading: false,
      refreshing: false,
      // role: 'user',
    };
  },
  computed: {
    role() {
      if (['referrer', 'merchant', 'user'].includes(this.$route.query.role)) {
        return this.$route.query.role;
      } else {
        return 'user';
      }
      // return this.$route.query.role || 'user'
    }
  },
  methods: {
    // 下拉刷新
    onRefresh() {
      if (this.refreshing) {
        this.refreshing = false;
      }
      this.$refs.subView.onRefresh();
    },
    
    goToMerchant() {
      this.$router.push('/merchant');
    },

    handleBack() {
      // this.MyGo(-1);
      this.$router.isBack = true;
      this.$router.replace('/');
    },
  },
};
</script>

<style scoped>
.top-deco {
  position: absolute;
  width: 100%;
  height: 210px;
  background: #ffa600;
  border-radius: 0px 0px 60px 60px;
  z-index: 0;
}
.content {
  position: relative;
  margin: 10px 40px 40px;
  text-align: left;
  box-sizing: border-box;
  padding-top: 40px;
  max-width: 670px;
  margin: 10px auto;
}

.to-merchant {
  position: sticky;
  bottom: 40px;
  width: 100%;
  text-align: center;
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 500;
  color: #ffa600;
  margin: 0 auto 40px;
  width: 200px;
  height: 60px;
  line-height: 60px;
  background-color: #ffffff50;
}
.van-icon-arrow {
  margin-left: 8px;
}
@media only screen and (max-width: 750px) {
  .role-wrapper {
    background: #fafafc;
  }
  .van-pull-refresh {
    min-height: 100vh;
  }
}
@media only screen and (min-width: 751px) {
  .role-wrapper {
    background: #fafafc;
  }
}
</style>
