<template>
  <div class="detail-wrapper">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <TheHeader :title="title" @click-left="handleBack" />
      <div class="top-deco"></div>
      <div class="content">
        <div class="tabs tabs-wrap">
          <div class="tab week" :class="{ active: actTab === 'wk' }" @click="handleTab('wk')">{{ $t('home.week') }}</div>
          <div class="tab mounth" :class="{ active: actTab === 'm1' }" @click="handleTab('m1')">{{ $t('home.mounth1') }}</div>
          <div class="tab mounth-3" :class="{ active: actTab === 'm3' }" @click="handleTab('m3')">{{ $t('home.mounth3') }}</div>
          <div class="tab all" :class="{ active: actTab === 'all' }" @click="handleTab('all')">{{ $t('home.all') }}</div>
        </div>
        <div class="total-wrap">
          <div class="tsr row" v-if="type === 'user'">
            <span class="tit">{{ $t('home.amount') }}</span>
            <span class="val">-{{ fromWei($route.query.amount || '0') }} TSR</span>
          </div>
          <div class="dst row">
            <span class="tit">{{ $t('home.total') }}</span>
            <span class="val">{{ fromWei($route.query.amount || '0') }} DST</span>
          </div>
      </div>
        <div class="tab-content">
          <div class="tab-panel" v-show="actTab === 'wk'">
            <van-list
              v-model="wk.loading"
              :finished="wk.finished"
              :finished-text="finiText()"
              :immediate-check="true"
              @load="onLoad"
            >
              <TheLogEmpty v-if="!wk.list.length" />
              <TheLogItem :item="item" :type="type" v-for="(item, index) in wk.list" :key="index" />
            </van-list>
          </div>
          <div class="tab-panel" v-show="actTab === 'm1'">
            <van-list
              v-model="m1.loading"
              :finished="m1.finished"
              :finished-text="finiText()"
              :immediate-check="true"
              @load="onLoad"
            >
              <TheLogEmpty v-if="!m1.list.length" />
              <TheLogItem :item="item" :type="type" v-for="(item, index) in m1.list" :key="index" />
            </van-list>
          </div>
          <div class="tab-panel" v-show="actTab === 'm3'">
            <van-list
              v-model="m3.loading"
              :finished="m3.finished"
              :finished-text="finiText()"
              :immediate-check="true"
              @load="onLoad"
            >
              <TheLogEmpty v-if="!m3.list.length" />
              <TheLogItem :item="item" :type="type" v-for="(item, index) in m3.list" :key="index" />
            </van-list>
          </div>
          <div class="tab-panel" v-show="actTab === 'all'">
            <van-list
              v-model="all.loading"
              :finished="all.finished"
              :finished-text="finiText()"
              :immediate-check="true"
              @load="onLoad"
            >
              <TheLogEmpty v-if="!all.list.length" />
              <TheLogItem :item="item" :type="type" v-for="(item, index) in all.list" :key="index" />
            </van-list>
          </div>
        </div>
      </div>

      <!-- <div class="coop-mail">{{ $t('home.cooperationEmail') }}</div> -->
    </van-pull-refresh>
  </div>
</template>

<script>
import gql from 'graphql-tag';
import TheLogItem from '@/components/TheLogItem.vue';
import TheLogEmpty from '@/components/TheLogEmpty.vue';
import { debounce } from '@/tool/utils';
import { tsrAddress } from '@/api/contract';

export default {
  components: {
    TheLogItem,
    TheLogEmpty
  },
  data() {
    return {
      refreshing: false,
      title: 'XXX',
      type: 'user',
      actTab: 'wk',
      pageSize: 20,
      totalResults: 0,
      curAddress: '',
      wk: {
        list: [],
        loading: false,
        finished: false,
        time: Math.floor((Date.now() - 86400000 * 7) / 1000)
      },
      m1: {
        list: [],
        loading: false,
        finished: false,
        time: Math.floor((Date.now() - 86400000 * 30) / 1000)
      },
      m3: {
        list: [],
        loading: false,
        finished: false,
        time: Math.floor((Date.now() - 86400000 * 90) / 1000)
      },
      all: {
        list: [],
        loading: false,
        finished: false,
        time: Math.floor(new Date(2021,5,12).getTime() / 1000)
      },
    };
  },
  computed: {
    role() {
      return this.$route.query.role
    },
  },
  methods: {
    finiText() {
      return this[this.actTab].list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    },
    watchAddress() {
      if (this.$route.query.user) {
        this.type = 'mer-user';
        this.title = this.$t('home.user') + this.addressShort(this.$route.query.user) + this.$t('home.disposeDetail');
        this.curAddress = this.$route.query.user;
      } else if (this.$route.query.referrer) {
        this.type = 'referrer';
        this.title = this.$t('home.referrer') + this.addressShort(this.$route.query.referrer) + this.$t('home.recommendDetail');
        this.curAddress = this.$route.query.referrer;
      } else if (this.$route.query.merchant) {
        this.type = 'merchant';
        this.title = this.$t('home.merchant') + this.addressShort(this.$route.query.merchant) + this.$t('home.recommendDetail');
        this.curAddress = this.$route.query.merchant;
      } else {
        this.MyGo(-1);
      }

      this.list = [];
      this.onLoad();
    },

    addressShort(addr) {
      return '...' + addr.slice(addr.length - 4);
    },

    addressChange(addr) {
      return addr.slice(0, 6) + '......' + addr.slice(addr.length - 10);
    },

    // 商家用户
    async reqMerchantUserList() {
      const actTab = this.actTab;
      console.log('token', this[actTab].time)
      const pageNo = Math.ceil(this[actTab].list.length / this.pageSize);

      try {
        const { data: { logs } } = await this.$apollo.query({
          query: gql`query ($from: Bytes!, $to: Bytes!, $token: Bytes!, $time: Int!, $first: Int!, $skip: Int!) {
            logs(where: { from: $from, to: $to, token: $token, timestamp_gte: $time }, first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
                id
                from
                to
                mid
                token
                amount
                timestamp
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            first: this.pageSize,
            skip: pageNo * this.pageSize,
            token: tsrAddress,
            from: this.curAddress,
            to: this.address,
            time: Math.floor(this[actTab].time)
          }
        })

        this[actTab].list.push(...logs);
        console.log('dispose list', this[actTab].list);
      } catch (error) {
        console.log(error);
      }

      // 加载状态结束
      this[actTab].loading = false;

      // 数据全部加载完成
      if (this[actTab].list.length < (pageNo + 1) * this.pageSize) {
        this[this.actTab].finished = true;
      }
      this[this.actTab].finished = true;
    },

    // 商家的推荐人 or 推荐人的合作商家
    async reqMerchantReferrerList() {
      const actTab = this.actTab;
      const pageNo = Math.ceil(this[actTab].list.length / this.pageSize);

      try {
        const { data: { logs } } = await this.$apollo.query({
          query: gql`query ($mid: Bytes!, $to: Bytes!, $token: Bytes!, $time: Int!, $first: Int!, $skip: Int!) {
            logs(where: { mid: $mid, to: $to, token: $token, timestamp_gte: $time }, first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
                id
                from
                to
                mid
                token
                amount
                timestamp
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            first: this.pageSize,
            skip: pageNo * this.pageSize,
            token: tsrAddress,
            mid: this.curAddress,
            to: this.address,
            time: Math.floor(this[actTab].time)
          }
        })

        this[actTab].list.push(...logs);
        console.log('dispose list', this[actTab].list);
      } catch (error) {
        console.log(error);
      }

      // 加载状态结束
      this[actTab].loading = false;

      // 数据全部加载完成
      if (this[actTab].list.length < (pageNo + 1) * this.pageSize) {
        this[this.actTab].finished = true;
      }
      this[this.actTab].finished = true;
    },
    
    async reqLogList() {
      if (this.$route.query.user) {
        this.reqMerchantUserList();
      } else if (this.$route.query.referrer) {
        this.reqMerchantReferrerList();
      } else if (this.$route.query.merchant) {
        this.reqMerchantReferrerList();
      }
    },

    onRefresh() {
      if (!this.$store.state.address) return;
      if (this.refreshing) {
        this.refreshing = false;
      }
      // 清空列表数据
      this[this.actTab].finished = false;
      this[this.actTab].list = [];

      this.onLoad();
    },

    onLoad() {
      console.log('onLoad');
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this[this.actTab].loading = true;
      this.reqLogList();
    },

    handleTab(tb) {
      this.actTab = tb;
      if (this[tb].list.length === 0) {
        this.onLoad();
      }
    },

    handleBack() {
      this.MyGo(-1);
    },

    copyCallback: debounce(function() {
      this.$toast.success(this.$t('message.addressCopied'));
    }, 350),
  },
};
</script>

<style scoped>
.top-deco {
  position: absolute;
  width: 100%;
  height: 80px;
  background: #ffa600;
  border-radius: 0px 0px 60px 60px;
  z-index: 0;
}
.content {
  position: relative;
  margin: 10px 40px 40px;
  text-align: left;
  box-sizing: border-box;
  max-width: 670px;
  margin: 10px auto;
}
.content .tabs-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  height: 138px;
  background: #fff;
  border-radius: 20px;
  font-size: 28px;
  font-weight: 500;
  color: #adb0ca;
}
.content .tabs-wrap .active {
  line-height: 132px;
  font-size: 30px;
  font-weight: bold;
  color: #ffa600;
  border-bottom: 6px solid #ffa600;
}
.content .tabs-wrap .tab {
  cursor: pointer;
}

.empty-wrap {
  margin-top: 50px;
  text-align: center;
}
.img-empty {
  width: 320px;
  margin-left: auto;
  margin-right: auto;
}

.total-wrap {
  position: sticky;
  bottom: 0;
  width: 670px;
  margin: 30px auto;
  background: #fff;
  border-radius: 20px;
  font-size: 36px;
  padding: 30px 56px;
  box-sizing: border-box;
}
.total-wrap .row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 80px;
}
.total-wrap .row .val {
  color: #a65200;
}
.total-wrap .dst {
  margin-top: auto;
}
.coop-mail {
  font-size: 26px;
  font-weight: 500;
  color: #adb0ca;
  text-align: center;
  margin-bottom: 30px;
}
@media only screen and (max-width: 750px) {
  .detail-wrapper {
    background: #fafafc;
  }
  .van-pull-refresh {
    min-height: 100vh;
  }
}
@media only screen and (min-width: 751px) {
  .detail-wrapper {
    background: #fafafc;
  }
}
</style>
