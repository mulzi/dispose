<template>
  <div class="dialog-dispose-qr-wrap">
    <van-dialog
      class="dialog-box"
      :show-cancel-button="false"
      :show-confirm-button="false"
      v-model="visible"
    >
      <div class="dialog-content">
        <p class="p title">{{ $t('home.scanToDispose') }}</p>
        <div class="dialog-qr-box">
          <div id="qrcode" ref="qrcode"></div>
        </div>
        <p class="p desc" v-if="role">{{ '商家销毁凭证收款码' }}</p>
        <p class="p desc" v-else>{{ $t('home.theQr').replace(/\{\{addr\}\}/, addressChange($store.state.address)) }}</p>
      </div>
      <div class="cancel-box">
        <van-icon
          class="cancel-btn"
          name="close"
          @click="visible = false"
        />
      </div>
    </van-dialog>
  </div>
</template>
<script>
import QRCode from 'qrcodejs2';
export default {
  data() {
    return {
      visible: false,
      role: null,
    }
  },
  methods: {
    addressChange(addr) {
      return addr.slice(0, 6) + '......' + addr.slice(addr.length - 6);
    },
    creatQrCode(url) {
      const dom = document.querySelector('.dialog-qr-box');
      const width = dom.clientWidth;
      this.$refs.qrcode.innerHTML = '';
      new QRCode(this.$refs.qrcode, {
        text: url, // 需要转换为二维码的内容
        width: width,
        height: width,
        colorDark: '#000000',
        colorLight: '#fff',
        correctLevel: QRCode.CorrectLevel.H,
      });

      this.$toast.clear();
    },
    hide() {
      this.visible = false;
    },
    show(url, role) {
      this.visible = true;
      setTimeout(() =>{
        this.creatQrCode(url);
      }, 0);

      this.role = role;
    }
  }
}
</script>
<style scoped>
.dialog-dispose-qr-wrap .title {
  margin-bottom: 50px;
  font-size: 30px;
  font-weight: 400;
  color: #091d42;
  line-height: 48px;
  text-align: center;
}
.dialog-dispose-qr-wrap .desc {
  font-size: 26px;
  font-weight: 400;
  color: #adb0ca;
  margin-top: 30px;
  margin-bottom: 30px;
  text-align: left;
  line-height: 1.6;
  word-break: break-all;
  text-align: center;
}
.dialog-dispose-qr-wrap .dialog-qr-box {
  width: 446px;
  height: 446px;
  margin-left: auto;
  margin-right: auto;
}
</style>
<style>
.dialog-dispose-qr-wrap .desc .p {
  margin: 12px 0;
}
.dialog-dispose-qr-wrap .desc .tit {
  margin: 20px 0;
  font-weight: bold;
}
</style>