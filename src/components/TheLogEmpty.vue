<template>
  <div class="empty-wrap">
    <img class="img-empty" src="../assets/img/box-empty.png" alt="" />
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
.empty-wrap {
  margin-top: 50px;
  text-align: center;
}
.empty-wrap .img-empty {
  width: 320px;
  margin-left: auto;
  margin-right: auto;
}
</style>