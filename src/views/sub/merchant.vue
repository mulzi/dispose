<template>
  <div class="merchant-wrap">
    <div class="role-wrap">
      <span class="role">{{ $t('home.merchantSub') }}</span>
      <div class="title switch-wrap" @click="goToUser">
        <img src="../../assets/img/role-switch3.png" alt="" class="img">
        <span>{{ $t('home.switchRole') }}</span>
      </div>
    </div>
    <div class="c-panel total-panel">
      <div class="top">
        <div class="asset-wrap">
          <div class="tit">{{ $t('home.merchantTotal') }}</div>
          <div class="asset-value">{{ toFixedFloor((merchantInfo.amount || 0) / 1e18, 2) }}</div>
          <Copy :content="$store.state.address" @copyCallback="copyCallback">
            <p class="address-line">
              {{ addressChange(address) }} <i class="copy-icon"></i>
            </p>
          </Copy>
        </div>
        <div class="qr-wrap" @click="handleShowQr">
          <div class="qr-box">
            <div id="qrcode" ref="qrcode"></div>
          </div>
          <div class="desc">{{ $t('home.qrCode') }}</div>
        </div>
      </div>
    </div>
    <div class="btns-wrap">
      <button class="btn btn-dark" :disabled="isUserBtnDisable" @click="handleToUserList('user')">
        {{ ((merchantInfo.sellerUser || {}).length || 0) + $t('home.user') }}
      </button>
      <button class="btn btn-dark" :disabled="isRecoBtnDisable" @click="handleToReferrerList('referrer')">
        {{ ((merchantInfo.midSeller || {}).length || 0) + $t('home.referrer') }}
      </button>
    </div>
    <div class="journal-list">
      <div class="journal-title">{{ $t('home.waterTitle') }}</div>
      <van-list
        v-model="listLoading"
        :finished="listFinished"
        :finished-text="dataText"
        @load="onLoad"
      >
        <TheLogEmpty v-if="!list.length" />
        <TheLogItem :item="item" :type="'merchant'" v-for="(item, index) in list" :key="index" />
      </van-list>
    </div>
    <div class="coop-mail">{{ $t('home.cooperationEmail') }}</div>
    <DialogDisposeQrCode  ref="dialogQR" />
  </div>
</template>
<script>
import DialogDisposeQrCode from '@/components/DialogDisposeQrCode.vue';
import TheLogItem from '@/components/TheLogItem.vue';
import TheLogEmpty from '@/components/TheLogEmpty.vue';
import gql from 'graphql-tag';
import { debounce } from '@/tool/utils';
import { tsrAddress } from '@/api/contract';
import QRCode from 'qrcodejs2';

export default {
  components: {
    DialogDisposeQrCode,
    TheLogItem,
    TheLogEmpty
  },
  data() {
    return {
      merchantInfo: {
        amount: 80000
      },
      listLoading: false,
      listFinished: true,
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
    },
    isUserBtnDisable() {
      return !this.merchantInfo || !this.merchantInfo.sellerUser || this.merchantInfo.sellerUser.length == 0
    },
    isRecoBtnDisable() {
      return !this.merchantInfo || !this.merchantInfo.midSeller || this.merchantInfo.midSeller.length == 0
    }
  },
  methods: {
    watchAddress() {
      this.$toast.loading();
      setTimeout(() => {
        this.creatQrCode()
      }, 100);

      this.list = [];
      this.reqMerchantInfo(true);
    },

    getQRUrl() {
      return window.location.origin + `/#/user?merchant=${this.address}&referrer=${this.address}`;
    },

    creatQrCode() {
      const url = this.getQRUrl();
      const dom = document.querySelector('.qr-box');
      document.querySelector('#qrcode').innerHTML = '';
      const width = dom.clientWidth;
      new QRCode(this.$refs.qrcode, {
        text: url, // 需要转换为二维码的内容
        width: width,
        height: width,
        colorDark: '#000000',
        colorLight: '#ffffff',
        // correctLevel: QRCode.CorrectLevel.H,
      });

      this.$toast.clear();
    },

    handleShowQr() {
      const url = this.getQRUrl();
      console.log('url', url);
      this.$refs.dialogQR.show(url, 'merchant');
    },

    addressChange(addr) {
      return addr.slice(0, 6) + '......' + addr.slice(addr.length - 6);
    },

    async reqMerchantInfo(isInit = false) {
      try {
        const { data: { seller } } = await this.$apollo.query({
          query: gql`query ($id: ID!) {
            seller(id: $id) {
                id
                address
                token
                amount
                sellerUser
                midSeller
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            id: tsrAddress + this.$store.state.address
          }
        })

        this.merchantInfo = seller || {};
        if (seller && isInit) {
          this.onRefresh();
        }
        console.log('merchant', this.merchantInfo);
      } catch (error) {
        console.log(error);
      }
    },

    async reqWaterList() {
      this.pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data: { logs } } = await this.$apollo.query({
          query: gql`query ($to: Bytes!, $token: Bytes!, $first: Int!, $skip: Int!) {
            logs(where: { to: $to, token: $token }, first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
                id,
                from,
                to,
                mid,
                token,
                amount,
                timestamp
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            first: this.pageSize,
            skip: this.pageNo * this.pageSize,
            token: this.merchantInfo.token,
            to: this.merchantInfo.address
          }
        })

        this.list.push(...logs);
        console.log('list', this.list);
      } catch (error) {
        console.log(error);
      }
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
      this.reqWaterList();
      this.reqMerchantInfo();
    },

    onLoad() {
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqWaterList();
    },

    goToUser() {
      this.$router.push('/user');
    },

    handleToUserList() {
      this.$router.push({ path: '/list', query: { role: 'user', from: this.address } });
    },
    
    handleToReferrerList() {
      this.$router.push({ path: '/list', query: { role: 'referrer', from: this.address } });
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
.role-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.role-wrap .role {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
}
.switch-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  width: 162px;
  height: 60px;
  background: #FFFFFF;
  border-radius: 30px;
  font-size: 26px;
  font-weight: 500;
  color: #ffa600;
}
.switch-wrap .img {
  width: 30px;
  height: 30px;
  margin-right: 0;
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
  font-weight: 500;
  color: #adb0ca;
}
.top {
  display: flex;
  justify-content: space-between;
}
.top .qr-wrap {
  width: 230px;
  cursor: pointer;
}
.top .qr-wrap .qr-box {
  width: 200px;
  height: 200px;
  margin-left: auto;
  margin-right: auto;
}
.top .qr-wrap .desc {
  font-size: 22px;
}
.top .desc {
  text-align: center;
  margin-top: 6px;
}
.asset-value {
  margin-top: 40px;
  margin-bottom: 60px;
  font-size: 50px;
  font-weight: 500;
  color: #091d42;
}
.total-panel .address-line {
  display: flex;
  align-items: center;
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

.btns-wrap {
  display: flex;
  justify-content: space-around;
  margin-top: 40px;
}
.btns-wrap .btn {
  width: 300px;
  text-align: center;
  font-size: 28px;
  font-weight: 500;
  cursor: pointer;
}

.journal-list {
  margin-top: 60px;
}
.journal-list .journal-title {
  margin-bottom: 30px;
  font-size: 36px;
  font-weight: 500;
  color: #091d42;
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

</style>