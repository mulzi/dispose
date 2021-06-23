<template>
  <div class="message">
    <van-pull-refresh
      v-model="refreshing"
      @refresh="onRefresh"
      :disabled="isPc"
    >
      <TheHeader :title="$t('message.title')" @click-left="handleBack" />
      <div class="message-content">
        <div class="content-bg mobile"></div>
        <div class="content">
          <section class="panel panel-list">
            <div class="title tabs">
              <div
                class="tab"
                :class="{ active: tabName == 'system' }"
                @click="handleTabChange('system')"
              >
                {{ $t('message.systemMessage') }}
                <span class="red-tag" v-show="newDt.system > 0">{{
                  newDt.system
                }}</span>
              </div>
              <div
                class="tab"
                :class="{ active: tabName == 'transfer' }"
                @click="handleTabChange('transfer')"
              >
                {{ $t('message.tradeInfo') }}
                <span class="red-tag" v-show="newDt.transfer > 0">{{
                  newDt.transfer
                }}</span>
              </div>
            </div>
            <!-- <SystemMessages
              ref="system"
              :refreshing="refreshing"
              v-show="tabName == 'system'"
            />
            <TransferMessages
              ref="transfer"
              :refreshing="refreshing"
              v-show="tabName == 'transfer'"
            /> -->
          </section>
        </div>
      </div>
    </van-pull-refresh>
  </div>
</template>

<script>
// import SystemMessages from '@/components/message/SystemMessages.vue';
// import TransferMessages from '@/components/message/TransferMessages.vue';
import { messageUnread } from '@/api/user';

export default {
  name: '',
  components: {
    // SystemMessages,
    // TransferMessages,
  },
  data() {
    return {
      isPc: false,
      tabName: 'system',
      refreshing: false,
      erc20Contract: '',
      whiteList: ['Falco', 'ROS', 'rFalco', 'Swift'],
      sysNew: 0,
      transNew: 3,
      newDt: {
        system: 0,
        transfer: 0,
      },
    };
  },
  computed: {
    address() {
      return this.$store.state.address;
    },
  },
  mounted() {
    this.newDt[this.tabName] = 0;
  },
  methods: {
    watchToken() {
      this.$nextTick(() => {
        this.onRefresh();
      });
    },
    handleTabChange(tab) {
      this.tabName = tab;
      this.$refs[this.tabName].initData();
      this.newDt[this.tabName] = 0;
    },
    onRefresh() {
      // 清空列表数据
      this.$refs[this.tabName].onRefresh();

      this.reqUnreadMessage();
      // 余额
      this.refreshing = false;
    },

    async reqUnreadMessage() {
      const params = {
        address: this.$store.state.address,
        type: this.tabName == 'system' ? 1 : 4, // 若当前处于 系统消息，则请求 交易消息未读数量
      };
      try {
        const { success, data } = await messageUnread(params);
        if (success) {
          this.tabName == 'system'
            ? (this.newDt.transfer = data)
            : (this.newDt.system = data);
        }
      } catch (error) {
        console.warn(error);
        this.$store.dispatch('addError', {
          error,
          func: `/rosLog/message/hintTotal/${params.address}/0`,
        });
      }
    },

    handleBack() {
      this.$router.isBack = true;
      this.$router.replace('/index');
    },
  },
};
</script>

<style scoped>
.message .message-content {
  position: relative;
  min-height: calc(100vh - 110px);
}
.message .content-bg {
  position: relative;
  background-color: #330066;
  border-radius: 0 0 50px 50px;
  height: 150px;
}
.message .content {
  position: relative;
  margin-top: -130px;
  padding: 50px;
  border-radius: 40px;
}
.message .content .panel {
  padding: 50px 40px;
  background-color: #fff;
  border-radius: 40px;
  text-align: left;
}
.panel-list .tabs {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 40px;
}
.panel-list .tab {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 500;
  color: #adb0ca;
  cursor: pointer;
  min-width: 200px;
  padding-bottom: 20px;
}
.panel-list .tab.active {
  font-size: 40px;
  font-weight: 600;
  color: #091d42;
  border-bottom: 6px solid #091d42;
}
.panel-list .tab .red-tag {
  margin-left: 10px;
  display: inline-block;
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: #f90066;
  border-radius: 50%;
  font-size: 20px;
  color: #fff;
}
.footer-text {
  margin-top: 60px;
  margin-bottom: 200px;
}

@media only screen and (max-width: 750px) {
  .message .content {
    padding: 0 30px;
    margin-left: auto;
    margin-right: auto;
  }
}
@media only screen and (min-width: 751px) {
  .message .content {
    padding: 0;
    width: 1000px;
    margin: 0 auto;
    margin-top: 52px;
  }
}
</style>
