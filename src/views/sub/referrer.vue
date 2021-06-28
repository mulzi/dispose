<template>
  <div class="referrer-wrap">
    <div class="title switch-wrap" @click="goToUser">
     <span>{{ $t('home.referrerSub') }}</span>
      <img src="../../assets/img/role-switch.png" alt="" class="img">
    </div>
      <div class="c-panel total-panel">
        <div class="top">
          <div class="asset-wrap">
            <div class="tit">{{ $t('home.recommendTotal') }}</div>
            <div class="asset-value">{{ toFixedFloor((referrerInfo.amount || 0) / 1e18, 2) }}</div>
          </div>
        </div>
        <Copy :content="$store.state.address" @copyCallback="copyCallback">
          <p class="address-line">
            {{ addressChange(address) }} <i class="copy-icon"></i>
          </p>
        </Copy>
      </div>
      <div class="c-panel input-panel">
        <div class="input-title">{{ $t('home.inputMerchantAddress') }}</div>
        <div class="input-wrap">
          <input class="input" type="text" v-model="inputAddress" placeholder="0x address" />
        </div>
        <div class="btn btn-dark" @click="handleGenerate">{{ $t('home.generateQr') }}</div>
        <div class="qr-wrap">
          <div class="qr-box">
            <div id="qrcode" ref="qrcode"></div>
          </div>
          <div class="tip" v-if="hasQr">
            <p class="p desc">{{ $t('home.theQr').replace(/\{\{addr\}\}/, addressChange($store.state.address)) }}</p>
            <p class="tip-scan">{{ $t('home.scanToDispose') }}</p>
          </div>
        </div>
      </div>
      <div class="journal-list">
        <div class="journal-title">
          <span>{{ $t('home.recommendLog') }}</span>
          <span class="tip" @click="handleToList('cooperators')">
            {{ ((referrerInfo.midSeller || {}).length || 0) + $t('home.recommendLogTip') }}
          </span>
        </div>
        <van-list
          v-model="listLoading"
          :finished="listFinished"
          :finished-text="dataText"
          @load="onLoad"
        >
          <TheLogEmpty v-if="!list.length" />
          <TheLogItem :item="item" :type="'referrer'" v-for="(item, index) in list" :key="index" />
        </van-list>
      </div>
      <DialogDisposeQrCode ref="dialogQR" />
  </div>
</template>
<script>
import DialogDisposeQrCode from '@/components/DialogDisposeQrCode.vue';
import TheLogItem from '@/components/TheLogItem.vue';
import TheLogEmpty from '@/components/TheLogEmpty.vue';
import { debounce } from '@/tool/utils';
import { tsrAddress } from '@/api/contract';
import gql from 'graphql-tag';
import QRCode from 'qrcodejs2';

export default {
  components: {
    DialogDisposeQrCode,
    TheLogItem,
    TheLogEmpty
  },
  data() {
    return {
      inputAddress: '',
      referrerInfo: {
        amount: 80000
      },
      listLoading: false,
      listFinished: true,
      pageNo: 0,
      pageSize: 10,
      list: [],
      hasQr: false,
    }
  },
  computed: {
    dataText() {
      return this.list.length > 0
        ? this.$t('message.noMore')
        : this.$t('message.noData');
    }
  },
  methods: {
    watchAddress() {
      this.reqReferrerInfo();
    },

    getQRUrl() {
      return window.location.origin + `/user?merchant=${this.inputAddress}&referrer=${this.address}`;
    },

    creatQrCode() {
      const address = this.getQRUrl();
      const dom = document.querySelector('.qr-box');
      document.querySelector('#qrcode').innerHTML = '';
      const width = dom.clientWidth;
      new QRCode(this.$refs.qrcode, {
        text: address, // 需要转换为二维码的内容
        width: width,
        height: width,
        colorDark: '#000000',
        colorLight: '#ffffff',
        // correctLevel: QRCode.CorrectLevel.H,
      });

      this.hasQr = true;
    },

    handleGenerate() {
      if (!this.$web3.utils.isAddress(this.inputAddress)) {
        return this.$toast.fail(this.$t('message.invalidAddress'));
      }

      this.creatQrCode();
      // const url = this.getQRUrl();
      // this.$refs.dialogQR.show(url);
    },

    async reqReferrerInfo() {
      try {
        const { data: { mid } } = await this.$apollo.query({
          query: gql`query ($id: ID!) {
            mid(id: $id) {
                id
                address
                token
                amount
                midUser
                midSeller
              }
            }`,
          fetchPolicy: "no-cache",
          variables: {
            id: tsrAddress + this.$store.state.address
          }
        })

        this.referrerInfo = mid || {};
        if (mid) {
          this.onRefresh();
        }
        console.log('referrer info', this.referrerInfo);
      } catch (error) {
        console.log(error);
      }
    },
    
    async reqRecommendList() {
      const pageNo = Math.ceil(this.list.length / this.pageSize);
      try {
        const { data: { logs } } = await this.$apollo.query({
          query: gql`query ($mid: Bytes!,$token: Bytes!, $first: Int!, $skip: Int!) {
            logs(where: { mid: $mid, token: $token }, first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc) {
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
            token: this.referrerInfo.token,
            mid: this.referrerInfo.address
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
      if (this.list.length < (pageNo + 1) * this.pageSize) {
        this.listFinished = true;
      }
    },

    onRefresh() {
      if (!this.$store.state.address) return;
      // 清空列表数据
      this.listFinished = false;
      this.list = [];

      this.onLoad();
    },

    onLoad() {
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqRecommendList();
    },

    addressChange(addr) {
      return addr.slice(0, 6) + '......' + addr.slice(addr.length - 6);
    },

    handleToList() {
      this.$router.push({ path: '/list', query: { role: 'merchant', from: this.address }});
    },

    goToUser() {
      this.$router.push('/user');
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
  width: 260px;
  height: 68px;
  border: 1px solid #FFFFFF;
  border-radius: 10px;
  margin-left: auto;
  margin-right: auto;
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
.input-panel .input-wrap {
  padding-bottom: 16px;
  border-bottom: 1px solid #DBDEE1;
}
.input-panel .input-wrap .input {
  width: 100%;
  line-height: 42px;
  height: 42px;
  font-size: 28px;
}
.input-panel .btn {
  width: 500px;
  margin: 102px auto 0;
}

.input-panel .qr-wrap {
  width: 480px;
  margin: 50px auto 0;
  text-align: center;
}

.input-panel .desc {
  margin-top: 30px;
  margin-bottom: 10px;
}
.input-panel .tip-scan {
  font-size: 26px;
  font-weight: normal;
  color: #5B6881;
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
  font-size: 28px;
  font-weight: 500;
  color: #A65200;
  cursor: pointer;
}

.journal-list .journal-item {
  margin-bottom: 28px;
  padding: 20px 30px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 20px;
  font-size: 25px;
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