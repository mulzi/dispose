<template>
  <div class="the-log-item">
    <div class="head">
      <span class="date">{{ formatTime(item.timestamp * 1000) }}</span>
      <span class="value" v-if="type == 'user' || type == 'mer-user'">-{{ toFixedFloor((item.amount || 0) / 1e18) }}(TSR)</span>
      <span class="value" v-if="type == 'merchant' || type == 'referrer'">+{{ toFixedFloor((item.amount || 0) / 1e18) }}(DST)</span>
    </div>
    <div class="addr" v-if="type == 'merchant' || type == 'mer-user'">Referrer: {{ item.mid }}</div>
    <div class="addr" v-if="type == 'merchant' || type == 'referrer'">From: {{ item.from }}</div>
    <div class="addr" v-if="type == 'referrer'">To: {{ item.to }}</div>
    <div class="addr" v-if="type == 'user' || type == 'mer-user'">To: {{ item.to }}</div>
  </div>
</template>
<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {}
    },
    type: {
      type: String,
      default: 'user'
    }
  }
}
</script>
<style scoped>
.the-log-item {
  margin-top: 28px;
  padding: 20px 30px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 20px;
  font-size: 24px;
  font-weight: 400;
  color: #adb0ca;
}
.the-log-item .head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.the-log-item .head .value {
  font-size: 30px;
  font-weight: 500;
  color: #091d42;
}

</style>