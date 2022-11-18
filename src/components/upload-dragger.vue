<template>
  <div v-if="enable"
    class="go-upload-dragger"
    :class="{dragging}"
    @dragenter="onDragenter"
    @dragleave="onDragleave"
    @dragover="onDragover"
    @drop="onDrop"
    @click="onClick"
  >
    <update-icon class="go-upload-dragger-icon" name="upload"></update-icon>
    <div class="go-upload-dragger-describe">
      <span>Drop file here or click to upload</span>
    </div>
  </div>
  <div v-else class="go-upload-dragger-enable">
    <update-icon class="go-upload-dragger-icon" name="upload" />
    <div class="go-upload-dragger-describe">
      <span>Drop file here or click to upload</span>
    </div>
  </div>
</template>

<script>
import UpdateIcon from "./icon";

export default {
  name: 'UploadDragger',
  props: {
    enable: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      dragging: false
    };
  },
  components: { UpdateIcon },
  methods: {
    onDragenter (e) {
      this.dragging = true;
      e.stopPropagation();
      e.preventDefault();
    },
    onDragleave (e) {
      this.dragging = false;
      e.stopPropagation();
      e.preventDefault();
    },
    onDragover (e) {
      e.stopPropagation();
      e.preventDefault();
    },
    onDrop (e) {
      this.dragging = false;
      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer.files;
      this.$emit('handle-files', files);
    },
    onClick () {
      this.$emit('on-click');
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../assets/styles/vars.scss';
.go-upload-dragger {
  border: 1px dashed $gray400;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  &.dragging {
    border-width: 2px;
    border-color: $primary;
    background-color: $gray200;
    .go-upload-dragger-icon {
      color: $primary;
    }
  }
  &:hover {
    border-color: $primary;
    cursor: pointer;
  }
  .go-upload-dragger-icon {
    font-size: 60px;
    color: $gray600;
  }
}
.go-upload-dragger-enable {
  border: 1px dashed #cccccc;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .go-upload-dragger-icon {
    font-size: 60px;
    color: #cccccc;
  }
  .go-upload-dragger-describe {
    color: #cccccc;
  }
}
</style>
