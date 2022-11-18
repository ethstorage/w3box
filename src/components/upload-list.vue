<template>
  <div class="go-upload-list">
    <div :class="['go-upload-list-item',file.status]" v-for="(file) in files" :key="file.uid">
      <!--  FIXME:code in here is so chaos, can it become more elegance?  -->
      <div class="go-upload-list-item-img">
        <update-icon v-if="file.status === 'pending'" class="go-upload-item-img-loading" name="loading"/>
        <template v-else-if="file.status === 'success'">
          <img v-if="isImage(file.type)" class="go-upload-list-item-img" :src="file.url" alt="">
          <update-icon v-else class="go-upload-item-file" name="file"/>
        </template>
        <update-icon v-else-if="file.status === 'failure'" class="go-upload-item-img-error" name="picture"/>
        <update-icon v-else class="go-upload-item-file" name="file"/>
      </div>

      <div class="go-upload-list-item-name">
        <a v-if="file.status==='success'" :href="file.url" target="_blank">
          <span>{{ file.name }}</span>
        </a>
        <span v-else>{{ file.name }}</span>
        <my-progress v-if="file.status === 'pending'" :percent="file.percent" :chunks="file.totalChunks"></my-progress>
      </div>

      <span v-if="file.status === 'success'" class="go-upload-list-item-delete" @click="onCopy(file.url)">
          <update-icon name="copy"></update-icon>
      </span>
      <span v-if="file.status === 'failure'" class="go-upload-list-item-delete" @click="onUpload(file)">
          <update-icon name="upload"></update-icon>
      </span>
      <span v-if="file.status!=='pending'&&file.status!=='success'" class="go-upload-list-item-delete" @click="onDelete(file)">
          <update-icon name="close"></update-icon>
      </span>
    </div>
  </div>
</template>

<script>
import UpdateIcon from "./icon";
import MyProgress from './progress';

export default {
  name: 'UploadList',
  props: {
    files: {
      type: Array,
      default() {
        return []
      }
    }
  },
  components: { UpdateIcon, MyProgress },
  data () {
    return {};
  },
  methods: {
    isImage(type) {
      if (!type) {return;}
      return type.includes('image');
    },
    onDelete(file) {
      this.$emit('on-delete', file);
    },
    onCopy(url) {
      this.$emit('on-copy', url);
    },
    onUpload(file) {
      this.$emit('on-reUpload', file);
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../assets/styles/mixins.scss";
@import "../assets/styles/vars.scss";
.go-upload-list {
  .go-upload-list-item {
    margin-top: 8px;
    padding: 8px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    border: 1px solid #d9d9d9;
  }
  .go-upload-list-item.failure {
    border: 1px solid $danger;
    color: $danger;
  }
  .go-upload-list-item.success {
    .go-upload-list-item-name {
      a {
        color: $success;
      }
      a:hover {
        color: #2dce8990;
      }
    }
  }
  .go-upload-list-item-name {
    margin-left: 8px;
    margin-right: 8px;
    flex: 1;
    font-weight: bold;
    @include ellipsis;
  }
  .go-upload-list-item-delete {
    font-size: 20px;
    width: 30px;
    height: 30px;
    cursor: pointer;
  }
  .go-upload-list-item-img {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    & > img {
      width: 100%;
      height: 100%;
    }
  }
  .go-upload-item-img-loading {
    font-size: 28px;
    @include spinner;
  }
  .go-upload-item-error,
  .go-upload-item-file {
    font-size: 38px;
  }
}
</style>
