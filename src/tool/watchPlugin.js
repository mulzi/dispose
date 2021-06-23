import { assetManagementAddress } from '@/api/contract.js';
import { findReplacementTx } from '@/tool/findReplacementTx.js';
import { toFixedFloor, formatTime } from '@/tool/utils';

const WatchMixin = {
  data() {
    return {
      authList: ['liquidity',],
      startBlock: 0, // 初始blockNumber
      pendingData: {}, // 通过nonce 作为key 来管理
      pendingTx: null, // 初始transaction 包含 from to nonce 等关键信息
      stateTimer: null,
      state: 0,
    };
  },
  computed:{
    address() {
      return this.$store.state.address;
    },
  },
  watch: {
    '$store.state.address': {
      immediate: true,
      handler(value) {
        if (value && typeof this.watchAddress === 'function') {
          this.watchAddress();
        }
      },
    },
    '$store.state.token': {
      // 二期期接口的token
      immediate: true,
      handler(value) {
        if (value && typeof this.watchToken === 'function') {
          this.watchToken();
        }
      },
    },
    '$store.state.auth': {
      // 一期接口的token
      immediate: true,
      handler(value) {
        if (value && typeof this.watchAuth === 'function') {
          this.watchAuth();
        }
      },
    },
  },
  beforeDestroy() {
    this.clearStateTimer();
  },
  methods: {
    toFixedFloor,
    formatTime,
    fromWei(wei) {
      return this.$web3.utils.fromWei(wei);
    },
    toWei(num) {
      return this.$web3.utils.toWei(num);
    },
    // 进行授权 ROS资产管理合约
    doAuthRos2ROSManagement() {
      this.doAuthRos2('rosManagement');
    },

    // 授权给 调度合约
    doAuthRos2Schedule() {
      this.doAuthRos2('schedule');
    },

    // 进行授权 流动性
    doAuthRos2Liquidity() {
      this.doAuthRos2('liquidity');
    },

    // 授权ROS 给目标合约， 如：'Liquidity'
    async doAuthRos2(contractName = 'liquidity') {
      this.$toast.clear();
      this.$toast.loading({
        duration: 0,
        forbidClick: true,
        message: this.$t('message.authorizing'),
      });
      let txHash = '';
      try {
        const addressName = `${contractName}Address`;
        const contractAddress = await this.$store.state.ros[addressName];
        const rosContract = await this.$store.dispatch('asset/getTokenContract', 'ROS',);
        await rosContract.methods
          .approve(
            contractAddress,
            '1111111111111111111111111111111111111111111111111111111'
          )
          .send({
            from: this.$store.state.address,
          })
          .on('transactionHash', (hash) => {
            txHash = hash;
            this.startCheckState(hash, contractName);
          });
        
        console.log('after await');
        this.removeByTxHash(txHash);
        if (typeof this.onAuthOK === 'function'){
          this.onAuthOK(contractName);
        }
      } catch (error) {
        console.warn(error);
        this.removeByTxHash(txHash);
        this.$toast.clear();
        if (typeof this.onAuthFail === 'function'){
          this.onAuthFail(error, contractName);
        }
        // if (error.code === 4001) {
        //   this.$toast.fail(this.$t('message.denied'));
        // } else {
        //   this.$toast.fail(this.$t('message.authError'));
        //   this.$store.dispatch('addError', {
        //     error,
        //     func: `doAuthRos2${contractName}()`,
        //   });
        // }
      }
    },

    async reqIsFalcoAuth2Management() {
      try {
        const falcoContract = await this.$store.dispatch('asset/getTokenContract', 'Falco');
        const falcoWei = await this.$store.dispatch('asset/getTokenBalance', 'Falco');
        const falcoBalance = new this.$web3.utils.BN(falcoWei);
        const allowanceWei = await falcoContract.methods
          .allowance(this.$store.state.address, assetManagementAddress)
          .call();
        const allowance = new this.$web3.utils.BN(allowanceWei);
        const isAuthFalco = allowance.gt(falcoBalance);
        this.$store.commit('ros/SET_AUTH_FALCO_2_MANAGEMENT', isAuthFalco);
      } catch (error) {
        console.warn(error);
      }
    },

    // 授权Falco 给资产管理合约
    async doAuthFalco2Management() {
      this.$toast.clear();
      this.$toast.loading({
        duration: 0,
        forbidClick: true,
        message: this.$t('message.authorizing'),
      });
      let txHash = '';
      try {
        const falcoContract = await this.$store.dispatch('asset/getTokenContract', 'Falco');
        await falcoContract.methods
          .approve(
            assetManagementAddress,
            '1111111111111111111111111111111111111111111111111111111'
          )
          .send({
            from: this.$store.state.address,
          })
          .on('transactionHash', (hash) => {
            txHash = hash;
            this.startCheckState(hash, 'FALCO_2_MANAGEMENT');
          });
        
        console.log('after await');
        this.removeByTxHash(txHash);
        if (typeof this.onAuthOK === 'function'){
          this.onAuthOK('FALCO_2_MANAGEMENT');
        }
      } catch (error) {
        console.warn(error);
        this.removeByTxHash(txHash);
        this.$toast.clear();
        if (typeof this.onAuthFail === 'function'){
          this.onAuthFail(error, 'FALCO_2_MANAGEMENT');
        }
      }
    },

    onReceiptOK(receipt, type) {
      console.log('onReceiptOK', receipt);
      this.clearStateTimer();
      if (this.authList.includes(type) && typeof this.onAuthOK === 'function') {
        this.onAuthOK(type);
      } else if (typeof this.onSendOK === 'function') {
        this.onSendOK(receipt, type);
      }
    },

    onReceiptFail(error, type) {
      console.log('onReceiptFail', error);
      this.clearStateTimer();
      if (this.authList.includes(type) && typeof this.onAuthFail === 'function') {
        this.onAuthFail(error, type);
      } else if (typeof this.onSendFail === 'function') {
        this.onSendFail(error, type);
      }
    },

    // 循环查询合约执行状态
    clearStateTimer() {
      if (this.stateTimer) {
        clearTimeout(this.stateTimer);
        this.stateTimer = null;
      }
    },

    checkPending(types) {
      const pds = localStorage.getItem('pendingTxs');
      if (!pds) return;

      this.pendingData = JSON.parse(pds);
      const entries = Object.entries(this.pendingData);
      const list = entries.filter(([key, value]) => (
        key
        && types.includes(value.type)
        && value.tx.from.toLowerCase() === this.$store.state.address.toLowerCase()
      ));
      if (list.length <= 0) return;

      // const pending = this.pendingData[list[0][0]];
      const pending = list[0][1];
      console.log('check pending', pending);
      if (!pending || !types.includes(pending.type)) return;

      this.$toast.loading({
        duration: 0,
        // forbidClick: true,
        message: this.authList.includes(pending.type)
                  ? this.$t('message.authorizing')
                  : this.$t('message.handling')
      })
      console.log('repending', pending);
      this.startCheckState(pending.tx.hash, pending.type);
    },

    startCheckState(hash, contractName) {
      this.waitGetReceipt(hash, contractName);
    },

    waitGetReceipt(hash, contractName) {
      this.clearStateTimer();
      this.stateTimer = setTimeout(() => {
        this.reqHashState(hash, contractName);
      }, 3000);
    },

    async reqHashState(hash, contractName) {
      console.log('hash: ', hash, contractName);
      if (!this.stateTimer || !hash) {
        return;
      }

      const pending = this.findTxInPending(hash);
      try {
        const transaction = await this.$web3.eth.getTransaction(hash);
        if (transaction) {
          this.addToPending(transaction, contractName);
          if (!transaction.blockHash) {
            // 等待阶段，继续轮询
            this.waitGetReceipt(hash, contractName);
          } else {
            // 结束轮询
            const receipt = await this.$web3.eth.getTransactionReceipt(hash);
            console.log('receipt', receipt, 'transaction', transaction);
            this.onReceiptOK(receipt, contractName);
            this.removeFromPending(transaction);
          }
        } else if (pending && !transaction) {
          const receipt = await findReplacementTx(this.$web3, pending.startBlock, pending.tx);
          console.log('replacement receipt', receipt);
          this.onReceiptOK(receipt, contractName);
          this.removeFromPending(pending.tx);
        } else if (pending) {
          this.onReceiptFail(new Error(hash), contractName);
          this.removeFromPending(pending.tx);
        }
      } catch (error) {
        console.log(error);
        this.onReceiptFail(error, contractName);
        if (pending && pending.tx) {
          this.removeFromPending(pending.tx);
        }
      }
    },

    async addToPending(transaction, type) {
      if (!transaction) return;
      const key = transaction.nonce;
      const startBlock = await this.$web3.eth.getBlockNumber();
      this.pendingData[key] = {
        type,
        startBlock,
        tx: transaction,
      }

      localStorage.setItem('pendingTxs', JSON.stringify(this.pendingData));
    },

    removeFromPending(transaction) {
      if (!transaction) return;
      const { nonce } = transaction;
      if (nonce in this.pendingData || String(nonce) in this.pendingData) {
        delete this.pendingData[String(nonce)];
      }

      console.log('remove', transaction, ' removed: ', this.pendingData);
      localStorage.setItem('pendingTxs', JSON.stringify(this.pendingData));
    },

    removeByTxHash(hash) {
      if (!hash) return;
      console.log('remove hash: ', hash);

      for (let [key, value] of Object.entries(this.pendingData)) {
        if (value.tx && value.tx.hash && (value.tx.hash.toLowerCase() === hash.toLowerCase())) {
          delete this.pendingData[key];
        }
      }

      localStorage.setItem('pendingTxs', JSON.stringify(this.pendingData));
    },

    findTxInPending(hash) {
      if (!hash) return;
      let r = null;
      for (let key of Object.keys(this.pendingData)) {
        if (hash.toLowerCase() === this.pendingData[key].tx.hash.toLowerCase()) {
          r = this.pendingData[key];
        }
      }

      return r;
    },
  },
};

export default {
  install(Vue) {
    Vue.mixin(WatchMixin);
  },
};
