<template>
  <div class="go-upload">
    <input
        :multiple="multiple"
        :accept="accept"
        class="go-upload-input"
        ref="input"
        type="file"
        @change="onInputChange"
    />
    <upload-dragger v-if="drag" :enable="enable" @on-click="onClickTrigger" @handle-files="uploadFiles" />
    <div v-else class="go-upload-trigger" @click="onClickTrigger">
      <slot></slot>
    </div>
    <upload-list v-if="enable && showList" @on-delete="onDelete" @on-reUpload="onReUpload" @on-copy="onCopy" :files="this.files" />
  </div>
</template>

<script>
import request from '@/utils/request';
import UploadList from './upload-list';
import UploadDragger from './upload-dragger';
const copy = require('clipboard-copy')

const sha3 = require('js-sha3').keccak_256;

const noop = () => {};

export default {
  name: 'w3q-deployer',
  components: { UploadDragger, UploadList },
  props: {
    fileContract: {
      type: String,
      default: ""
    },
    dirPath: {
      type: String,
      default: ""
    },
    beforeUpload: { type: Function },
    onChange: { type: Function, default: noop },
    onSuccess: { type: Function, default: noop },
    onError: { type: Function, default: noop },
    onProgress: { type: Function, default: noop },
    onExceed: { type: Function, default: noop },
    accept: { type: String },
    multiple: { type: Boolean, default: false },
    customRequestClint: { type: Function, default: request },
    limit: { type: Number },
    // active drag and drop mode
    drag: {
      type: Boolean,
      default: true
    },
    showList: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      files: [],
      // store all uploading files xhr instance, so that can invoke xhr.abort to cancel upload request
      reqs: {},
      currentReq: null
    };
  },
  computed: {
    enable() {
      return this.fileContract !== null;
    }
  },
  methods: {
    // event
    onClickTrigger () {
      if (this.enable) {
        this.$refs.input.click();
      }
    },
    onInputChange (e) {
      // e.target.files is pseudo array, need to convert to real array
      const rawFiles = Array.from(e.target.files);
      this.uploadFiles(rawFiles);
    },
    uploadFiles (rawFiles) {
      rawFiles = this.clearFile(rawFiles);
      const filesLen = rawFiles.length + this.files.length;
      if (this.limit && this.limit < filesLen) {
        return this.onExceed(rawFiles, this.files);
      }
      this.startUpload(rawFiles);
    },
    clearFile(rawFiles) {
      const newFiles = [];
      for (const rawFile of rawFiles) {
        const uid = sha3(rawFile.name + rawFile.size + rawFile.type);
        let isExits = false;
        for (const file of this.files) {
          if (file.uid === uid) {
            isExits = true;
            break;
          }
        }
        if (!isExits) {
          newFiles.push(rawFile);
        }
      }
      return newFiles;
    },

    // init
    startUpload (rawFiles) {
      for (const rawFile of rawFiles) {
        const file = this.normalizeFiles(rawFile);
        this.normalizeReq(file);
      }
      // auto start upload
      this.autoUpload();
    },
    normalizeFiles (rawFile) {
      let chunkSize = 1;
      if (rawFile.size > 475 * 1024) {
        chunkSize = Math.ceil(rawFile.size / (475 * 1024));
      }
      const file = {
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type,
        totalChunks: chunkSize,
        percent: 0,
        uid: sha3(rawFile.name + rawFile.size + rawFile.type),
        status: 'init', // value list: init pending success failure
        raw: rawFile
      };
      // concat does not change the existing arrays, but instead returns a new array
      this.files.push(file);
      return file;
    },
    normalizeReq (file) {
      const { uid } = file;
      this.reqs[uid] = {
        contractAddress: this.fileContract,
        dirPath: this.dirPath,
        file: file,
        onSuccess: this.handleSuccess.bind(this, file),
        onError: this.handleError.bind(this, file),
        onProgress: this.handleProgress.bind(this, file)
      };
    },
    getFirstReq() {
      const keys = Object.keys(this.reqs);
      if (keys && keys.length > 0) {
        return this.reqs[keys[0]];
      }
      return null;
    },
    async autoUpload() {
      if(this.currentReq){
        // is upload
        return;
      }
      if (!this.beforeUpload || this.beforeUpload()) {
        this.currentReq = this.getFirstReq();
        while (this.currentReq) {
          const options = this.currentReq;
          const file = this.currentReq.file;
          file.status = 'pending';
          this.onChange(file, this.files);
          await this.customRequestClint(options);

          // next
          this.currentReq = this.getFirstReq();
        }
      }
    },

    // fallback
    handleError(file, error) {
      const { uid } = file;
      delete this.reqs[uid];
      file.status = 'failure';
      this.onError(error, file, this.files);
    },
    handleSuccess(file, response) {
      const { uid } = file;
      delete this.reqs[uid];
      file.status = 'success';
      // Not only front end can implement picture preview but also back end can do it. Here make use of back end api
      this.$set(file, 'url', response.path);
      this.onChange(file, this.files);
      this.onSuccess(response, file, this.files);
    },
    handleProgress(file, event) {
      file.percent = event.percent;
      this.onChange(file, this.files);
      this.onProgress(event, file, this.files);
    },

    onCopy(url) {
      copy(url);
      this.$notify({
        title: 'Success',
        message: 'Copy Success',
        type: 'success'
      });
    },
    onDelete (file) {
      const i = this.files.indexOf(file);
      this.files.splice(i, 1);
      this.abort(file);
    },
    onReUpload(file) {
      file.status = 'init';
      file.percent = 0;
      this.onChange(file, this.files);
      this.normalizeReq(file);
      this.autoUpload();
    },
    abort (file) {
      const { uid } = file;
      if (this.reqs[uid]) {
        delete this.reqs[uid];
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.go-upload {
  .go-upload-input {
    display: none;
    width: 100%;
  }
}
</style>
