<template>
  <div class="merchant-wrap">
    <div class="title">{{ $t('home.merchantSub') }}</div>
      <div class="c-panel total-panel">
        <div class="top">
          <div class="asset-wrap">
            <div class="tit">{{ $t('home.merchantTotal') }}</div>
            <div class="asset-value">{{ toFixedFloor((merchantInfo.amount || 0) / 1e18, 4) }}</div>
          </div>
          <div class="qr-wrap" @click="handleShowQr">
            <div class="qr-box">
              <div id="qrcode" ref="qrcode"></div>
            </div>
            <div class="desc">{{ $t('home.qrCode') }}</div>
          </div>
        </div>
        <Copy :content="$store.state.address" @copyCallback="copyCallback">
          <p class="address-line">
            {{ addressChange(address) }} <i class="copy-icon"></i>
          </p>
        </Copy>
      </div>
      <div class="btns-wrap">
        <div class="btn btn-light" @click="handleToUserList('user')">{{ (merchantInfo.userCount || 0) + $t('home.user') }}</div>
        <div class="btn btn-light" @click="handleToRecommenderList('recommender')">{{ (merchantInfo.midCount || 0) + $t('home.recommender') }}</div>
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
    }
  },
  methods: {
    watchAddress() {
      this.$toast.loading();
      setTimeout(() => {
        this.creatQrCode()
      }, 0);

      this.reqMerchantInfo();
    },

    creatQrCode() {
      const address = this.$store.state.address;
      const dom = document.querySelector('.qr-box');
      const width = dom.clientWidth;
      new QRCode(this.$refs.qrcode, {
        text: address, // 需要转换为二维码的内容
        width: width,
        height: width,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });

      this.$toast.clear();
    },

    handleShowQr() {
      this.$refs.dialogQR.show(this.$store.state.address);
    },

    addressChange(addr) {
      return addr.slice(0, 6) + ' ...... ' + addr.slice(addr.length - 10);
    },

    async reqMerchantInfo() {
      try {
        const { data: { seller } } = await this.$apollo.query({
          query: gql`query ($id: ID!) {
            seller(id: $id) {
                id
                address
                token
                amount
                userCount
                midCount
                users
                mids
              }
            }`,
          variables: {
            id: tsrAddress + this.$store.state.address
          }
        })

        this.merchantInfo = seller || {};
        if (seller) {
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
            logs(where: { to: $to, token: $token }, first: $first, skip: $skip) {
                id,
                from,
                to,
                mid,
                token,
                amount,
                timestamp
              }
            }`,
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
    },

    onLoad() {
      if (!this.$store.state.address) return;

      // 将 loading 设置为 true，表示处于加载状态
      this.listLoading = true;
      this.reqWaterList();
    },

    handleToUserList() {
      this.$router.push({ path: '/list', query: { role: 'user'} });
    },
    
    handleToRecommenderList() {
      this.$router.push({ path: '/list', query: { role: 'recommender'} });
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
.top {
  display: flex;
  justify-content: space-between;
}
.top .qr-wrap {
  width: 150px;
}
.top .qr-wrap .qr-box {
  width: 106px;
  height: 106px;
  margin-left: auto;
  margin-right: auto;
}
.top .desc {
  text-align: center;
  margin-top: 6px;
}
.asset-value {
  margin-top: 23px;
  font-size: 48px;
  font-weight: 500;
  color: #091D42;
}
.total-panel .address-line {
  display: flex;
  align-items: center;
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
  line-height: 80px;
  text-align: center;
  font-size: 28px;
  font-weight: 500;
  color: #FFA600;
}

.journal-list {
  margin-top: 60px;
}
.journal-list .journal-title {
  margin-bottom: 30px;
  font-size: 36px;
  font-weight: 500;
  color: #091D42;
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