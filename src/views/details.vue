<template>
  <div class="detail-wrapper">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <TheHeader :title="title" @click-left="handleBack" />
      <div class="top-deco"></div>
      <div class="content content-table">
        <div class="tabs tabs-wrap">
          <div class="tab week" :class="{ active: actTab === 'wk' }" @click="handleTab('wk')">{{ $t('home.week') }}</div>
          <div class="tab mounth" :class="{ active: actTab === 'm1' }" @click="handleTab('m1')">{{ $t('home.mounth1') }}</div>
          <div class="tab mounth-3" :class="{ active: actTab === 'm3' }" @click="handleTab('m3')">{{ $t('home.mounth3') }}</div>
          <div class="tab all" :class="{ active: actTab === 'all' }" @click="handleTab('all')">{{ $t('home.all') }}</div>
        </div>
        <div class="tab-content">
          <div class="tab-panel" v-show="actTab === 'wk'">
            <van-list
              v-model="wk.loading"
              :finished="wk.finished"
              :finished-text="wkFiText"
              :immediate-check="false"
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
              :finished-text="m1FiText"
              :immediate-check="false"
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
              :finished-text="m3FiText"
              :immediate-check="false"
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
              :finished-text="allFiText"
              :immediate-check="false"
              @load="onLoad"
            >
              <TheLogEmpty v-if="!all.list.length" />
              <TheLogItem :item="item" :type="type" v-for="(item, index) in all.list" :key="index" />
            </van-list>
          </div>
        </div>
      </div>
      <div class="coop-mail">{{ $t('home.cooperationEmail') }}</div>
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
      title: '',
      type: 'user',
      actTab: 'wk',
      pageSize: 20,
      totalResults: 0,
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
        // time: Math.floor(new Date(2021,6,12).getTime() / 1000)
        time: Math.floor((Date.now() - 86400000 * 190) / 1000)
      },
    };
  },
  computed: {
    role() {
      return this.$route.query.role
    },
    allFiText() {
      return this.all.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    },
    wkFiText() {
      return this.wk.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    },
    m1FiText() {
      return this.m1.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    },
    m3FiText() {
      return this.m3.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    },
  },
  created() {
  },
  mounted: {
  },
  methods: {
    watchAddress() {
      if (this.$route.query.user) {
        this.type = 'user';
        this.title = this.$t('home.user') + this.addressShort(this.$route.query.user) + this.$t('home.disposeDetail');
        this.reqUserInfo(this.$route.query.user);
      } else if (this.$route.query.recommender) {
        this.type = 'recommender';
        this.title = this.$t('home.recommender') + this.addressShort(this.$route.query.recommender) + this.$t('home.recommendDetail');
        this.reqUserInfo(this.$route.query.recommender);
      } else if (this.$route.query.merchant) {
        this.type = 'merchant';
        this.title = this.$t('home.merchant') + this.addressShort(this.$route.query.merchant) + this.$t('home.recommendDetail');
        this.reqUserInfo(this.$route.query.merchant);
      } else {
        this.MyGo(-1);
      }
    },

    addressShort(addr) {
      return '...' + addr.slice(addr.length - 4);
    },

    addressChange(addr) {
      return addr.slice(0, 6) + ' ...... ' + addr.slice(addr.length - 10);
    },

    async reqUserInfo(address) {
      try {
        const { data: { user } } = await this.$apollo.query({
          query: gql`query ($id: ID!) {
            user(id: $id) {
                id
                address
                token
                amount
              }
            }`,
          variables: {
            id: tsrAddress + address.toLowerCase()
          }
        })

        this.userInfo = user;
        console.log('userinfo', this.userInfo, tsrAddress + address);
        if (user) {
          this.list = [];
          this.onLoad();
        }
      } catch (error) {
        console.log(error);
      }
    },
    
    async reqLogList() {
      const actTab = this.actTab;
      console.log('token', this.userInfo.token, this[actTab].time)
      const pageNo = Math.ceil(this[actTab].list.length / this.pageSize);

      try {
        const { data: { logs } } = await this.$apollo.query({
          query: gql`query ($from: Bytes!, $token: Bytes!, $time: Int!, $first: Int!, $skip: Int!) {
            logs(where: { from: $from, token: $token, timestamp_gte: $time }, first: $first, skip: $skip) {
                id
                from
                to
                mid
                token
                amount
                timestamp
              }
            }`,
          variables: {
            first: this.pageSize,
            skip: pageNo * this.pageSize,
            token: this.userInfo.token,
            from: this.userInfo.address,
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
      if (this[this.actTab].list.length === 0) {
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
  height: 100px;
  background: #ffa600;
  border-radius: 0px 0px 60px 60px;
  z-index: 0;
}
.content {
  position: relative;
  margin: 10px 40px 40px;
  text-align: left;
  box-sizing: border-box;
}
.content .tr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  font-size: 26px;
  font-weight: 400;
  color: #091D42;
  background: #fff;
  border-radius: 20px;
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
  color: #ADB0CA;
}
.content .tabs-wrap .active {
  line-height: 132px;
  font-size: 30px;
  font-weight: bold;
  color: #ffa600;
  border-bottom: 6px solid #ffa600;
}
.content .tr .no {
  flex: 1;
}
.content .tr .address {
  flex: 5;
}
.content .tr .amount {
  flex: 4;
  text-align: right;
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

.coop-mail {
  font-size: 24px;
  font-weight: 500;
  color: #ADB0CA;
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
