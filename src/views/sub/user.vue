<template>
  <div class="user-wrap">
    <div class="title switch-wrap" @click="goToReferrer">
     <span>{{ $t('home.userSub') }}</span>
      <img src="../../assets/img/role-switch.png" alt="" class="img">
    </div>
    <div class="c-panel total-panel">
      <div class="top">
        <div class="asset-wrap">
          <span class="tit">{{ $t('home.disposeTotal') }}</span>
          <span class="asset-value">{{ toFixedFloor((userInfo.amount || 0) / 1e18, 2) }}</span>
        </div>
      </div>
      <Copy :content="$store.state.address" @copyCallback="copyCallback">
        <p class="address-line">
          {{ addressChange(address) }} <i class="copy-icon"></i>
        </p>
      </Copy>
    </div>
    <div class="c-panel input-panel" v-if="isShowDispose">
      <div class="input-title">{{ $t('home.disposeToken') }}</div>
      <div class="input-wrap">
        <span class="input">{{ disposeToken }}</span>
      </div>
      <div class="input-title dispose-title">{{ $t('home.disposeNumber') }}</div>
      <div class="input-wrap">
        <!-- v-focus -->
        <input
          class="input"
          type="number"
          v-model="inputValue"
          oninput="if(value.length>10)value=value.slice(0,10)"
          :placeholder="tsrBalance"
        />
      </div>
      <p class="risk-tip protocol-tip">
        <span class="handler" @click="handleAgreeProtocol" :class="{ on: isAgreed }">{{ $t('home.protocolPrev') }}</span>
        <a
          href="javascript:void(0);"
          class="link"
          @click.stop="$refs.dialogProtocol.show()"
        >
          {{ $t('home.protocolName') }}
        </a>
      </p>
      <button class="btn btn-dark btn-dispose" :disabled="isDisabled" v-intervalclick='{ func: handleDispose }'>{{ $t('message.confirm') }}</button>
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
    <div class="coop-mail">{{ $t('home.cooperationEmail') }}</div>
    <div class="to-merchant" @click="goToMerchant">
      <span>{{ $t('home.toMerchant') }}</span>
      <van-icon name="arrow" />
    </div>
    <DialogProtocol ref="dialogProtocol" />
  </div>
</template>
<script>
import gql from 'graphql-tag';
import TheLogItem from '@/components/TheLogItem.vue';
import TheLogEmpty from '@/components/TheLogEmpty.vue';
import DialogProtocol from '@/components/DialogProtocol.vue';
import { debounce } from '@/tool/utils';
import { tsrAddress, disposeAddress } from '@/api/contract';

export default {
  components: {
    TheLogItem,
    TheLogEmpty,
    DialogProtocol
  },
  data() {
    return {
      timer: null,
      isShowDispose: false,
      merchant: '',
      referrer: '',
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
      list: [],
      isAgreed: false,
    }
  },
  computed: {
    dataText() {
      return this.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    },
    isDisabled() {
      return +this.inputValue <= 0 || !this.isAgreed;
    }
  },
  watch: {
    inputValue(value) {
      if (value > this.tsrBalance) {
        this.inputValue = this.tsrBalance;
        this.$toast.fail('TSR余额'+this.tsrBalance);
      }
    }
  },
  beforeDestroy() {
    clearTimeout(this.timer);
    this.timer = null;
  },
  methods: {
    watchAddress() {
      this.list = [];
      this.reqUserInfo(true);
      this.reqUserBalance();
      if (this.$route.query.merchant) {
        this.isShowDispose = true;
        this.merchant = this.$route.query.merchant;
      }

      if (this.$route.query.referrer) {
        this.referrer = this.$route.query.referrer;
      }

      this.checkPending(['dispose']);
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

    async reqUserInfo(refresh = false) {
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
          fetchPolicy: "no-cache",
          variables: {
            id: tsrAddress + this.$store.state.address
          }
        })

        this.userInfo = user || {};
        console.log('userInfo', this.userInfo)
        if (user && refresh) {
          this.onRefresh();
        }
      } catch (error) {
        console.log(error);
      }
    },

    async reqDisposeList() {
      console.log('token', this.userInfo.token)
      const pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data: { logs } } = await this.$apollo.query({
          query: gql`query ($from: Bytes!, $token: Bytes!, $first: Int!, $skip: Int!) {
            logs(where: { from: $from, token: $token }, first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
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
      this.listFinished = this.list.length < (pageNo + 1) * this.pageSize;
    },

    onRefresh() {
      if (!this.$store.state.address) return;

      // 清空列表数据
      this.listFinished = false;
      this.list = [];

      this.onLoad();
      this.reqUserInfo();
      this.reqUserBalance();
    },

    onLoad() {
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqDisposeList();
    },

    // 执行销毁
    async handleDispose() {
      if (!this.$web3.utils.isAddress(this.merchant)) {
        this.$toast.fail(this.$t('home.invalidMerchantAddress'));
        return;
      }
      this.$toast.loading({
        duration: 0,
        forbidClick: true,
        message: this.$t('message.destroying')
      })
      const extraData = this.merchant + (this.referrer ? this.referrer.slice(2) : '0000000000000000000000000000000000000000');
      console.log('extraData', extraData);
      let txHash = '';
      this.$tsrContract.methods
        .approveAndCall(disposeAddress, this.inputValue * 1e5, extraData)
        .send({
          from: this.$store.state.address
        })
        .on('transactionHash', (hash) => {
          txHash = hash;
          this.startCheckState(txHash, 'dispose');
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
      this.$toast.success(this.$t('message.destroyOK'));
      this.inputValue = '';

      this.timer = setTimeout(() => {
        this.onRefresh();
      }, 5000);
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

      this.$toast.fail(this.$t('message.destroyError'));
    },

    addressChange(addr) {
      return addr.slice(0, 6) + '......' + addr.slice(addr.length - 10);
    },

    handleAgreeProtocol() {
      this.isAgreed = !this.isAgreed;
    },
        
    goToMerchant() {
      this.$router.push('/merchant');
    },

    goToReferrer() {
      this.$router.push('/referrer');
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
.switch-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 230px;
  height: 68px;
  border: 1px solid #fff;
  border-radius: 10px;
  margin-left: auto;
  margin-right: auto;
  cursor: pointer;
}
.switch-wrap .img {
  width: 40px;
  height: 40px;
}
.c-panel {
  background: #fff;
  border-radius: 40px;
}
.total-panel {
  line-height: 1;
  margin-top: 30px;
  padding: 80px 30px 70px;
  font-size: 28px;
  color: #adb0ca;
}
.total-panel .asset-wrap {
  display: flex;
  align-items: center;
}
.total-panel .asset-value {
  font-size: 56px;
  font-weight: 500;
  color: #091d42;
  margin-left: 30px;
}
.total-panel .address-line {
  display: flex;
  align-items: center;
  margin-top: 20px;
  cursor: pointer;
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
  color: #adb0ca;
  margin-bottom: 20px;
}
.input-panel .dispose-title {
  margin-top: 50px;
}
.input-panel .input-wrap {
  height: 80px;
  line-height: 80px;
  background: #fff;
  border: 1px solid #f6f7f8;
  border-radius: 20px;
  text-indent: 16px;
}
.input-panel .input-wrap .input {
  width: 100%;
  line-height: 42px;
  height: 42px;
  font-size: 30px;
  font-size: bold;
}
.input-panel .btn-dispose {
  margin-top: 40px;
  width: 500px;
}
.input-panel .protocol-tip {
  position: relative;
  padding-left: 40px;
  margin-top: 20px;
}
.input-panel .handler {
  position: relative;
}
.input-panel .handler::before {
  content: '';
  position: absolute;
  left: -40px;
  top: 2px;
  display: block;
  width: 24px;
  height: 24px;
  border: 2px solid #ffa600;
  border-radius: 6px;
}
.input-panel .handler.on::before {
  border: 2px solid #ffa600;
  background: #ffa600;
  border-radius: 5px;
}
.input-panel .handler::after {
  content: '';
  position: absolute;
  left: -34px;
  top: 8px;
  display: block;
  width: 12px;
  height: 6px;
  border-left: 4px solid #fcf1dd;
  border-bottom: 4px solid #fcf1dd;
  transform: rotate(-45deg);
}
.input-panel .handler.on::after {
  border-left: 4px solid rgb(255, 255, 255);
  border-bottom: 4px solid rgb(255, 255, 255);
}
.input-panel .protocol-tip .link {
  color: #ffa600;
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
  color: #091d42;
}
.journal-list .journal-title .tip {
  font-size: 28px;
  font-weight: 500;
  color: #a65200;
}

.journal-list .journal-item {
  margin-bottom: 28px;
  padding: 20px 30px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 20px;
  font-size: 25px;
  font-weight: 400;
  color: #adb0ca;
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
  color: #091d42;
}

.to-merchant {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 500;
  color: #ffa600;
  margin: 0 auto 40px;
  width: 200px;
  cursor: pointer;
}
</style>