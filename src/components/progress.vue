<template>
  <div class="group">
    <div ref="inner" class="progress" v-for="index in chunks" :key="index">
      <div v-if="index - 1 < percent" class="progress-inner"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Progress',
  props: {
    percent: {
      type: Number,
      default: 0
    },
    chunks: {
      type: Number,
      default: 1
    }
  },
  watch: {
    chunks: {
      handler (val) {
        this.$nextTick(() => {
          for (const v of this.$refs.inner) {
            v.style.width = (1 / val * 100 - 0.1) + '%';
          }
        });
      },
      immediate: true
    }
  },
};
</script>

<style lang="scss" scoped>
@import "../assets/styles/vars.scss";
.group{
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  width: 100%;
}
.progress {
  background-color: #cccccc;
  border-radius: 100px;
  height: 6px;
  transition: width 0.2s linear;
  .progress-inner {
    background-color: $primary;
    height: 100%;
    width: 100%;
    border-radius: 100px;
  }
}
</style>
