<template>
  <div class="role-wrapper">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <TheHeader :title="title" @click-left="handleBack" />
      <div class="top-deco"></div>
      <div class="content content-table">
        <div class="tr tr-head" v-if="type === 'user'">
          <div class="td no">{{ $t('home.no') }}</div>
          <div class="td address">{{ $t('home.userAddress') }}</div>
          <div class="td amount">{{ $t('home.userDisposeAmount') }}</div>
        </div>
        <div class="tr tr-head" v-if="type === 'referrer'">
          <div class="td no">{{ $t('home.no') }}</div>
          <div class="td address">{{ $t('home.referrerAddress') }}</div>
          <div class="td amount">{{ $t('home.referrerAmount') }}</div>
        </div>
        <div class="tr tr-head" v-if="type === 'merchant'">
          <div class="td no">{{ $t('home.no') }}</div>
          <div class="td address">{{ $t('home.merchantAddress') }}</div>
          <div class="td amount">{{ $t('home.referrerAmount') }}</div>
        </div>
        <div class="empty-wrap" v-if="!list.length">
          <img class="img-empty" src="../assets/img/box-empty.png" alt="" />
        </div>
        <van-list
          v-model="listLoading"
          :finished="listFinished"
          :finished-text="dataText"
          @load="onLoad"
        >
          <div class="tr tb" v-for="(item, index) in list" :key="index" @click="handleToDetail(item)">
            <div class="td no">{{ index + 1 }}</div>
            <div class="td address">{{ addressChange(item.userAddress || item.midAddress || item.sellerAddress) }}</div>
            <div class="td amount">{{ fromWei(item.amount) }} DST</div>
          </div>
        </van-list>
      </div>
      <div class="coop-mail">{{ $t('home.cooperationEmail') }}</div>
    </van-pull-refresh>
  </div>
</template>

<script>
import gql from 'graphql-tag';
import { debounce } from '@/tool/utils';
import { tsrAddress } from '@/api/contract';

export default {
  components: {
  },
  data() {
    return {
      from: '',
      title: 'ooo',
      type: 'user',
      refreshing: false,
      listLoading: false,
      listFinished: true,
      pageNo: 0,
      pageSize: 20,
      list: []
    };
  },
  computed: {
    role() {
      return this.$route.query.role
    },
    dataText() {
      return this.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    },
  },
  created() {
  },
  mounted() {
  },
  methods: {
    watchAddress() {
      this.from = this.$route.query.from;
      if (this.$route.query.role === 'user') {
        this.type = 'user';
        this.title = this.$t('home.userList');
        this.queryUser(this.from);
      } else if (this.$route.query.role === 'referrer') {
        this.type = 'referrer';
        this.title = this.$t('home.referrerList');
        this.queryReferrer(this.from);
      } else if (this.$route.query.role === 'merchant') {
        this.type = 'merchant';
        this.title = this.$t('home.merchantList');
        this.queryMerchant(this.from);
      } else {
        this.MyGo(-1);
      }
      // this.onRefresh();
    },

    addressChange(addr) {
      return addr.slice(0, 6) + ' ...... ' + addr.slice(addr.length - 6);
    },

    async queryUser(from) {
      const pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data: { seller: { sellerUser } } } = await this.$apollo.query({
          query: gql`query ($id: ID!, $first: Int!, $skip: Int!) {
            seller(id: $id) {
                id
                address
                token
                amount
                sellerUser(first: $first, skip: $skip){
                  id
                  userAddress
                  amount
                }
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            id: tsrAddress + from,
            first: this.pageSize,
            skip: pageNo * this.pageSize,
          }
        })

        this.list = sellerUser;
        console.log('users', sellerUser);
      } catch (error) {
        console.warn(error);
      }

      this.$toast.clear();
      // 加载状态结束
      this.listLoading = false;

      // 数据全部加载完成
      if (this.list.length < (pageNo + 1) * this.pageSize) {
        this.listFinished = true;
      }
    },

    async queryReferrer(from) {
      const pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data: { seller: { midSeller } } } = await this.$apollo.query({
          query: gql`query ($id: ID!, $first: Int!, $skip: Int!) {
            seller(id: $id) {
                id
                address
                token
                amount
                midSeller(first: $first, skip: $skip){
                  id
                  midAddress
                  amount
                }
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            id: tsrAddress + from,
            first: this.pageSize,
            skip: pageNo * this.pageSize,
          }
        })

        this.list = midSeller;
        console.log('mids', midSeller);
      } catch (error) {
        console.warn(error);
      }

      this.$toast.clear();
      // 加载状态结束
      this.listLoading = false;

      // 数据全部加载完成
      if (this.list.length < (pageNo + 1) * this.pageSize) {
        this.listFinished = true;
      }
    },

    async queryMerchant(from) {
      const pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data: { mid: { midSeller } } } = await this.$apollo.query({
          query: gql`query ($id: ID!, $first: Int!, $skip: Int!) {
            mid(id: $id) {
                id
                address
                token
                amount
                midSeller(first: $first, skip: $skip){
                  id
                  sellerAddress
                  amount
                }
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            id: tsrAddress + from,
            first: this.pageSize,
            skip: pageNo * this.pageSize,
          }
        })

        this.list = midSeller;
        console.log('midSeller', midSeller)
      } catch (error) {
        console.warn(error);
      }

      this.$toast.clear();
      // 加载状态结束
      this.listLoading = false;

      // 数据全部加载完成
      if (this.list.length < (pageNo + 1) * this.pageSize) {
        this.listFinished = true;
      }
    },

    reqList() {
      if (this.$route.query.role === 'user') {
        this.queryUser(this.from);
      } else if (this.$route.query.role === 'referrer') {
        this.queryreferrer(this.from);
      } else if (this.$route.query.role === 'cooperator') {
        this.queryMerchant(this.from);
      }
    },

    onRefresh() {
      if (!this.$store.state.address) return;

      if (this.refreshing) {
        this.refreshing = false;
      }
      // 清空列表数据
      this.listFinished = false;
      this.list = [];

      this.onLoad();
    },

    onLoad() {
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqList();
    },

    handleToDetail(item) {
      let query = {};
      if (this.type === 'user') {
        query = { user: item.userAddress, amount: item.amount };
      } else if (this.type === 'referrer') {
        query = { referrer: item.midAddress, amount: item.amount };
      } else if (this.type === 'merchant') {
        query = { merchant: item.sellerAddress, amount: item.amount };
      }

      this.$router.push({ path: '/details', query });
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
  padding: 20px 20px 40px;
  background: #fff;
  border-radius: 40px;
  max-width: 670px;
  margin: 10px auto;
}
.content .tr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  font-size: 28px;
  font-weight: 400;
  color: #091D42;
  padding: 20px 0;
}
.content .tr-head {
  font-size: 26px;
  font-weight: 400;
  color: #ADB0CA;
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
.content .tb {
  cursor: pointer;
}

.coop-mail {
  font-size: 24px;
  font-weight: 500;
  color: #ADB0CA;
  text-align: center;
  margin-top: 30px;
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
