<template>
  <div class="recommender-wrap">
    <div class="title">{{ $t('home.userSub') }}</div>
      <div class="c-panel total-panel">
        <div class="top">
          <div class="asset-wrap">
            <div class="tit">{{ $t('home.disposeTotal') }}</div>
            <div class="asset-value">{{ toFixedFloor((userInfo.amount || 0) / 1e18, 4) }}</div>
          </div>
        </div>
        <Copy :content="$store.state.address" @copyCallback="copyCallback">
          <p class="address-line">
            {{ addressChange(address) }} <i class="copy-icon"></i>
          </p>
        </Copy>
      </div>
      <div class="c-panel input-panel">
        <div class="input-title">{{ $t('home.disposeToken') }}</div>
        <div class="input-wrap">
          <span class="input">{{ disposeToken }}</span>
        </div>
        <div class="input-title dispose-title">{{ $t('home.disposeNumber') }}</div>
        <div class="input-wrap">
          <input
            class="input"
            type="text"
            v-model="inputValue"
            oninput="if(value.length>10)value=value.slice(0,10)"
            placeholder="销毁数量"
          />
        </div>
        <div class="btn btn-dark" v-intervalclick='{ func: handleDispose }'>{{ $t('message.confirm') }}</div>
      </div>
      <div class="journal-list">
        <div class="journal-title">
          <span>{{ $t('home.disposeLog') }}</span>
        </div>
        <van-list
          v-model="listLoading"
          :finished="listFinished"
          :finished-text="dataText"
          @load="onLoad"
        >
          <TheLogEmpty v-if="!list.length" />
          <TheLogItem :item="item" :type="'user'" v-for="(item, index) in list" :key="index" />
        </van-list>
      </div>
  </div>
</template>
<script>
import gql from 'graphql-tag';
import TheLogItem from '@/components/TheLogItem.vue';
import TheLogEmpty from '@/components/TheLogEmpty.vue';
import { debounce } from '@/tool/utils';
import { tsrAddress, disposeAddress } from '@/api/contract';

export default {
  components: {
    TheLogItem,
    TheLogEmpty
  },
  data() {
    return {
      listLoading: false,
      listFinished: true,
      tsrBalance: 0,
      inputValue: '',
      disposeToken: 'TSR',
      userInfo: {
        id: '',
        address: '',
        token: '',
        amount: 80000
      },
      pageNo: 0,
      pageSize: 10,
      list: []
    }
  },
  computed: {
    dataText() {
      return this.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    }
  },
  watch: {
    inputValue(value) {
      if (value > this.tsrBalance) {
        this.inputValue = this.tsrBalance;
      }
    }
  },
  methods: {
    watchAddress() {
      this.reqUserInfo();
      this.reqUserBalance();
    },

    async reqUserBalance() {
      try {
        const wei = await this.$tsrContract.methods
          .balanceOf(this.address).call();
        this.tsrBalance = wei / 1e5;
        console.log('tsrBalance', this.tsrBalance);
      } catch (error) {
        console.warn(error);
      }
    },

    async reqUserInfo() {
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
            id: tsrAddress + this.$store.state.address
          }
        })

        this.userInfo = user;
        if (user) {
          this.onRefresh();
        }
        console.log('merchant', this.userInfo);
      } catch (error) {
        console.log(error);
      }
    },

    async reqDisposeList() {
      console.log('token', this.userInfo.token)
      this.pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data: { logs } } = await this.$apollo.query({
          query: gql`query ($from: Bytes!, $token: Bytes!, $first: Int!, $skip: Int!) {
            logs(where: { from: $from, token: $token }, first: $first, skip: $skip) {
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
            skip: this.pageNo * this.pageSize,
            token: this.userInfo.token,
            from: this.userInfo.address
          }
        })

        this.list.push(...logs);
        console.log('dispose list', this.list);
      } catch (error) {
        console.log(error);
      }

      // 加载状态结束
      this.listLoading = false;

      // 数据全部加载完成
      this.listFinished = this.list.length < (this.pageNo + 1) * this.pageSize;
    },

    onRefresh() {
      if (!this.$store.state.address) return;
      // 清空列表数据
      this.listFinished = false;
      this.list = [];

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqDisposeList();
    },

    onLoad() {
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqDisposeList();
    },

    // 执行销毁
    async handleDispose() {
      let txHash = '';
      this.$tsrContract.methods
        .approveAndCall(disposeAddress, this.$web3.utils.toWei(this.inputValue), )
        .send({
          from: this.$store.state.address
        })
        .on('transactionHash', (hash) =>{
          txHash = hash
          this.reqHashState(txHash, 'dispose');
        })
        .on('receipt', (receipt) => {
          this.removeByTxHash(txHash);
          this.onSendOK(receipt, 'dispose');
        })
        .on('error', (error) => {
          this.removeByTxHash(txHash);
          this.onSendFail(error, 'dispose')
        })
    },

    onSendOK(receipt, type) {
      if (type !== 'dispose') return;

      this.clearStateTimer();
      this.addIng = false;
      this.$toast.clear();
      this.$toast.success(this.$t('message.handleOK'));
    },

    onSendFail(error, type) {
      if (type !== 'dispose') return;

      this.clearStateTimer();
      this.addIng = false;
      this.$toast.clear();

      if (error.code === 4001) {
        this.$toast.fail(this.$t('message.denied'));
        return;
      }

      this.$toast.fail(this.$t('message.handleError'));
    },

    addressChange(addr) {
      return addr.slice(0, 6) + ' ...... ' + addr.slice(addr.length - 10);
    },

    copyCallback: debounce(function() {
      this.$toast.success(this.$t('message.addressCopied'));
    }, 350),
  }
}
</script>

<style scoped>
.title {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
}
.c-panel {
  background: #fff;
  border-radius: 40px;
}
.total-panel {
  line-height: 1;
  margin-top: 30px;
  padding: 80px 30px 70px;
  font-size: 24px;
  font-weight: 500;
  color: #ADB0CA;
}
.total-panel .asset-value {
  margin-top: 23px;
  font-size: 48px;
  font-weight: 500;
  color: #091D42;
}
.total-panel .address-line {
  display: flex;
  align-items: center;
  margin-top: 20px;
}
.total-panel .address-line .copy-icon {
  display: inline-block;
  width: 30px;
  height: 30px;
  background: url('../../assets/img/copy-add.png') no-repeat;
  background-size: 100% 100%;
  margin-left: 12px;
  opacity: 0.3;
}

.input-panel {
  padding: 46px 30px 70px;
  margin-top: 30px;
}
.input-panel .input-title {
  font-size: 28px;
  font-weight: 400;
  color: #ADB0CA;
  margin-bottom: 20px;
}
.input-panel .dispose-title {
  margin-top: 50px;
}
.input-panel .input-wrap {
  height: 80px;
  line-height: 80px;
  background: #fff;
  border: 1px solid #F6F7F8;
  border-radius: 20px;
  text-indent: 16px;
}
.input-panel .input-wrap .input {
  width: 100%;
  line-height: 42px;
  height: 42px;
  font-size: 26px;
}
.input-panel .btn {
  margin-top: 60px;
}

.journal-list {
  margin-top: 60px;
}
.journal-list .journal-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  font-size: 36px;
  font-weight: 500;
  color: #091D42;
}
.journal-list .journal-title .tip {
  font-size: 24px;
  font-weight: 500;
  color: #A65200;
}

.journal-list .journal-item {
  margin-bottom: 28px;
  padding: 20px 30px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 20px;
  font-size: 24px;
  font-weight: 400;
  color: #ADB0CA;
}
.journal-list .journal-item .head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.journal-list .journal-item .head .value {
  font-size: 30px;
  font-weight: 500;
  color: #091D42;
}

</style>