<template>
  <div id="wallet">
    <div class="user">
      <div class="wallet" @click.stop="openDialog">
        <div class="wallet-img"/>
        <div class="balance">{{ this.balance }} ETH</div>
      </div>
      <div class="favorite" />
    </div>

    <b-modal v-model="isShow"
             :canCancel="false"
             has-modal-card
             trap-focus>
      <SessionCard :needCancel="isNeedClose"/>
    </b-modal>
  </div>
</template>

<script>
import {queryBalance} from "@/utils/Session";
import BigNumber from 'bignumber.js';
import SessionCard from './SessionCard';
import EventBus from '@/utils/eventBus';

export default {
  name: "SessionComponent",
  data: () => ({
    loadInterval: null,
    balance: '0.000',
    isShow: false,
    isNeedClose: false,
  }),
  components: {
    SessionCard
  },
  computed: {
    sessionAddress() {
      return this.$store.state.sessionAddr;
    },
  },
  watch: {
    sessionAddress(newVal) {
      if (!newVal) {
        this.isShow = false;
      }
    }
  },
  async created() {
    this.initData();
    EventBus.$on('show', value => {
      this.isShow = value;
      this.isNeedClose = true;
    });
  },
  methods: {
    parseFixed(value) {
      if (isNaN(value)) {
        value = 0;
      } else {
        value = value.toString();
      }
      return new BigNumber(value).toFixed(3, BigNumber.ROUND_DOWN);
    },
    initData() {
      if (this.loadInterval) {
        clearInterval(this.loadInterval);
      }
      setTimeout(this.loopQueryBalance, 1500);
      this.loadInterval = setInterval(this.loopQueryBalance, 20000,);
    },
    async loopQueryBalance() {
      if (this.sessionAddress) {
        const balance = await queryBalance(this.sessionAddress);
        this.balance = this.parseFixed(balance);
      }
    },

    openDialog() {
      this.isShow = true;
    }
  },
};
</script>

<style scoped>
#wallet {
  display: flex;
  justify-content: center;
}

.user{
  display: flex;
  flex-direction: row;
}

.wallet {
  height: 38px;
  border-radius: 14px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 8px 4px 4px;
  border: 1px solid transparent;
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  background-image: linear-gradient(to right, #fff, #fff), linear-gradient(to right, #8F41E9, #578AEF);;
  cursor: pointer;
}
.wallet-img {
  width: 24px;
  height: 20px;
  background-image: url("../assets/ethereum.svg");
  background-repeat:no-repeat;
  background-size:100% 100%;
  -moz-background-size:100% 100%;
}
.balance {
  font-size: 14px;
  line-height: 30px;
  text-align: center;
  margin-left: 4px;
}
</style>
