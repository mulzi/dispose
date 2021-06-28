<template>
  <div class="header-common">
    <van-nav-bar
      :title="title"
      :border="false"
      @click-left="$emit('click-left')"
    >
      <!-- <template #left>
        <span class="swift-role">{{ $t('home.switchRole') }}</span>
      </template> -->
      <!-- <template #right>
        <img
          class="icon icon-lang"
          @click="handleToggleLanguage"
          :src="imgUrlLang"
          :alt="$i18n.locale"
        />
      </template> -->
    </van-nav-bar>
  </div>
</template>

<script>
// import TheHeaderPC from '@/components/TheHeaderPC.vue';

export default {
  name: '',
  components: {
    // TheHeaderPC,
  },
  props: {
    title: {
      type: String,
      default: ''
    },
  },
  computed: {
    imgUrlLang() {
      return this.$i18n.locale == 'zh-CN'
        ? require('../assets/img/en.png')
        : require('../assets/img/cn.png');
    },
  },
  methods: {
    handleToggleLanguage() {
      const lang = this.$i18n.locale == 'en-US' ? 'zh-CN' : 'en-US';
      this.$store.commit('setLanguage', lang);
    },
  }
};
</script>

<style scoped>
.header-common .icon {
  width: 44px;
  height: 44px;
}
.swift-role {
  width: 128px;
  height: 55px;
  line-height: 55px;
  text-align: center;
  border: 1px solid #fff;
  border-radius: 10px;
  color: #fff;
  font-size: 24px;
  font-weight: 500;
}
</style>
