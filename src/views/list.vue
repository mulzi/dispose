<template>
  <div class="role-wrapper">
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <TheHeader :title="$t('home.userList')" @click-left="handleBack" />
      <div class="top-deco"></div>
      <div class="content content-table">
        <div class="tr tr-head">
          <div class="td no">{{ $t('home.no') }}</div>
          <div class="td address">{{ $t('home.userAddress') }}</div>
          <div class="td amount">{{ $t('home.userDisposeAmount') }}</div>
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
          <div class="tr" v-for="(item, index) in list" :key="index">
            <div class="td no">{{ index + 1 }}</div>
            <div class="td address">{{ addressChange(item.address) }}</div>
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

export default {
  components: {
  },
  data() {
    return {
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
      this.$toast.loading();
      this.onRefresh();
    },

    addressChange(addr) {
      return addr.slice(0, 6) + ' ...... ' + addr.slice(addr.length - 10);
    },

    queryUser() {
      return this.$apollo.query({
        query: gql`query ($to: Bytes!,$token: Bytes!) {
          logs(where: { to: $to, token: $token }) {
              id
              address
              token
              amount
            }
          }`,
        variables: {
          to: this.$store.state.address,
          token: this.$store.state.token,
        }
      })
    },

    queryRecommender() {
      return this.$apollo.query({
        query: gql`query ($address: Bytes!, $first: Int!, $skip: Int!) {
          mids(where: { address: $address }, first: $first, skip: $skip) {
              id
              address
              token
              amount
              userCount
            }
          }`,
        variables: {
          first: this.pageSize,
          skip: this.pageNo * this.pageSize,
          address: this.$store.state.address
        }
      })
    },

    queryMerchant() {
      return this.$apollo.query({
        query: gql`query ($address: Bytes!, $first: Int!, $skip: Int!) {
          sellers(where: { address: $address }, first: $first, skip: $skip) {
              id
              address
              token
              amount
              userCount
              midCount
            }
          }`,
        variables: {
          first: this.pageSize,
          skip: this.pageNo * this.pageSize,
          address: this.$store.state.address
        }
      })
    },

    getFunc() {
      switch (this.$route.query.role) {
        case 'user':
          return this.queryUser();
        case 'recommender':
          return this.queryRecommender();
        case 'merchant':
          return this.queryMerchant();
      }
    },

    async reqUserList() {
      console.log('req list data')
      this.pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data } = await this.getFunc()
        if (data.users) {
          this.list.push(...data.users);
        } else if (data.mids) {
          this.list.push(...data.mids);
        } else if (data.sellers) {
          this.list.push(...data.sellers);
        }
        console.log('list', this.list);
      } catch (error) {
        console.log(error);
      }

      this.$toast.clear();
      // 加载状态结束
      this.listLoading = false;

      // 数据全部加载完成
      if (this.list.length < (this.pageNo + 1) * this.pageSize) {
        this.listFinished = true;
      }
    },

    onRefresh() {
      if (!this.$store.state.address) return;
      // 清空列表数据
      this.listFinished = false;
      this.list = [];

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqUserList()
    },

    onLoad() {
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqUserList();
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
}
.content .tr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  font-size: 26px;
  font-weight: 400;
  color: #091D42;
  padding: 20px 0;
}
.content .tr-head {
  font-size: 24px;
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
