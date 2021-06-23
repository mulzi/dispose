<template>
  <div class="role-wrapper">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <TheHeader :title="$t('home.title')" @click-left="handleBack" />
      <div class="top-deco"></div>
      <component class="content" :is="role" ref="subView" :refreshing="refreshing" />
      <div class="coop-mail">{{ $t('home.cooperationEmail') }}</div>
    </van-pull-refresh>
  </div>
</template>

<script>
import merchant from './sub/merchant.vue'
import recommender from './sub/recommender.vue'
import user from './sub/user.vue'

export default {
  components: {
    user,
    merchant,
    recommender,
  },
  data() {
    return {
      loading: false,
      refreshing: false,
    };
  },
  computed: {
    role() {
      return this.$route.query.role
    }
  },
  created() {
  },
  mounted() {
  },
  methods: {
    // 下拉刷新
    onRefresh() {
      if (this.refreshing) {
        this.refreshing = false;
      }
      this.$refs.subView.onRefresh();
    },

    handleBack() {
      this.MyGo(-1);
    },
  },
};
</script>

<style scoped>
.top-deco {
  position: absolute;
  width: 100%;
  height: 210px;
  background: #FFA600;
  border-radius: 0px 0px 60px 60px;
  z-index: 0;
}
.content {
  position: relative;
  margin: 10px 40px 40px;
  text-align: left;
  box-sizing: border-box;
  padding-top: 40px;
}


.coop-mail {
  font-size: 24px;
  font-weight: 500;
  color: #ADB0CA;
  text-align: center;
  margin-bottom: 30px;
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
