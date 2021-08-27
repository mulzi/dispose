<template>
  <div ref="logs" class="List">
    <h1>Logs</h1>
    <ul>
      <li v-for="(v, k) of list" :key="k">
        <span class="sid"> {{ v.id }}</span>
        <span class="sdate">date: {{ v.date }}</span>
        <span class="sfund">fund: {{ v.price }} tsr</span>
      </li>
    </ul>
    <a ref="more" href="javascript:void(0)" :style="dis" v-on:click="fetchList(list.length)">{{btnText}}</a>
  </div>
</template>
<script>
import { getBurnLogs } from "@/api/ab.js";
export default {
  data() {
    return {
      list: [],
      dis: "pointer-events:auto",
      btnText: 'More'
    };
  },
  mounted() {
    this.list = []
    this.initData();
  },
  updated() {
    this.scrollToBottom(this.$refs.logs.scrollHeight)
  },
  methods: {
    stapToDate(datetime) {
      var date = new Date(datetime*1000); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
      var year = date.getFullYear(),
          month = ("0" + (date.getMonth() + 1)).slice(-2),
          sdate = ("0" + date.getDate()).slice(-2),
          hour = ("0" + date.getHours()).slice(-2),
          minute = ("0" + date.getMinutes()).slice(-2),
          second = ("0" + date.getSeconds()).slice(-2);
      // 拼接
      var result =
          year +
          "-" +
          month +
          "-" +
          sdate +
          " " +
          hour +
          ":" +
          minute +
          ":" +
          second;
      // 返回
      return result;
    },
    initData() {
      console.log('initData')
      this.fetchList()
    },
    scrollToBottom(top) {
      setTimeout(() => {
        window.scroll({
          left: 0,
          top,
          behavior: 'smooth'
        })
      }, 5)
    },
    fetchList(skip=0,first=4) {
      console.log('skip', skip)
      getBurnLogs({ first: first, skip: skip })
          .then((res) => {
            console.log(res)
            let logs = res.data.logs;
            let len = logs.length;
            const temp = []
            for (let i = 0; i < len; ++i) {
              temp.push({
                id: logs[i].from,
                date: this.stapToDate(logs[i].timestamp),
                price: logs[i].amount / 1e18,
              });
            }
            this.list.push(...temp)
            if(len<first){
              this.$refs.more.setAttribute("disabled",true)
              this.btnText = "No more ~~"
              this.dis = "pointer-events:none;color: #678172;text-decoration:none;"
            }
          })
          .catch((err) => {
            console.log(err);
          });
    },
  },
};
</script>
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  padding: 0;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  /* justify-content: flex-start; */
}
li {
  /* display: inline-block; */
  margin: 10px 3px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  line-height: 30px;
  position: relative;
  box-shadow: 5px 5px 4px #678172;
}
li::before {
  content: '';
  display: inline-block;
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 5px;
  background: black;
  top: 10px;
  left: 0x;
}
li > span{
  text-indent: 10px;
}
a {
  color: #42b983;
}
</style>