<template>
  <el-card class="dialog_card">
    <div class="dialog_item">
      <p class="item-title">Proxy Account</p>
      <i class="el-icon-close item-close" @click="$parent.close()"/>
    </div>
    <el-card class="wallet-card">
      <div class="dialog_item">
        <div class="wallet-top-item">
          <div class="wallet-address">{{ accountShort }}</div>
          <img class="wallet-copy" src="../assets/copy.svg" @click="onCopy"/>
        </div>
        <img class="wallet-disconnect" src="../assets/disconnect.svg" @click="onDisconnct"/>
      </div>
      <div class="wallet-title2">Balance</div>
      <div class="balance">${{balance}} ETH</div>
    </el-card>

    <el-divider />
    <div class="gas-title">Transfer gas fee</div>
    <div class="wallet-top-item gas-layout">
      <el-input class="item-input" placeholder="0.00 ETH" @input="didInputStakeAmount" v-model="input" />
      <el-button type="warning" round class="records-btn" :loading='progress' @click="onTransfer">
        Transfer
      </el-button>
    </div>
  </el-card>
</template>

<script>
import BigNumber from 'bignumber.js';
import {mapActions} from "vuex";
import {transferGas, queryBalance} from "@/utils/Session";
const copy = require('clipboard-copy')

export default {
  name: "SessionCardComponent",
  props: {
    needCancel: Boolean,
  },
  data: () => ({
    balance: '0.000',
    input: '',
    progress: false,
  }),
  computed: {
    aaAddress() {
      return this.$store.state.sessionAddr;
    },
    accountShort() {
      return (
          this.aaAddress ?
          this.aaAddress.substring(0, 6) +
          "..." +
          this.aaAddress.substring(
              this.aaAddress.length - 4,
              this.aaAddress.length
          ) : ''
      );
    },
  },
  created() {
    this.loopQueryBalance();
  },
  methods: {
    ...mapActions(["setAccount", "setSessionKey", "setSessionAddr"]),
    parseFixed(value) {
      if (isNaN(value)) {
        value = 0;
      } else {
        value = value.toString();
      }
      return new BigNumber(value).toFixed(3, BigNumber.ROUND_DOWN);
    },
    predicateValue(value, fixed = 18) {
      if (value == null) {
        return null;
      }
      value = value.replace(/[^\d.]/g, ''); //清除"数字"和"."以外的字符
      value = value.replace(/\.{2,}/g, '.'); //只保留第一个. 清除多余的
      value = value.replace(/^0+\./g, '0.');
      value = value.match(/^0+[1-9]+/)
          ? (value = value.replace(/^0+/g, ''))
          : value;
      let reg = new RegExp(`^\\d*(\\.?\\d{0,${fixed}})`, 'g');
      value = value.match(reg)[0] || '';
      if (value == '.') {
        value = '0.';
      }
      return value;
    },
    async loopQueryBalance() {
      if (this.aaAddress) {
        const balance = await queryBalance(this.aaAddress);
        this.balance = this.parseFixed(balance);
      }
    },

    didInputStakeAmount() {
      const value = this.predicateValue(this.input);
      if (value !== this.input) {
        this.input = value;
      }
    },
    onCopy() {
      copy(this.aaAddress);
      this.$notify({
        title: 'Success',
        message: 'Copy Success',
        type: 'success'
      });
    },
    onDisconnct() {
      this.setAccount(null);
      this.setSessionKey(null);
      this.setSessionAddr(null);
      this.$parent.close();
    },
    async onTransfer() {
      const amount = this.input;
      if (!amount) {
        this.$message.error('Invalid amount');
        return;
      }

      this.progress = true;
      const result = await transferGas(amount, this.aaAddress);
      this.progress = false;
      if(result) {
        await this.loopQueryBalance();
        this.$notify({
          title: 'Success',
          message: 'Transfer Success',
          type: 'success'
        });
        if(this.needCancel) {
          this.$parent.close();
        }
      } else {
        this.$message.error('Transfer Fail!');
      }
    },
  },
};
</script>

<style scoped>
.dialog_card {
  position: relative;
  border-radius: 16px;
  width: 420px;
}

.dialog_item{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.item-title {
  font-size: 20px;
  color: #000000;
  line-height: 20px;
  font-weight: bold;
}
.item-close {
  font-size: 22px;
  cursor: pointer;
}

.wallet-card {
  margin-top: 20px;
  border-radius: 16px;
  background: linear-gradient(0.01deg, #2c788a 2.11%, #52DEFF 97.26%);
}
.wallet-top-item {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.wallet-address {
  border-radius: 12px;
  padding: 5px 12px;
  font-size: 16px;
  line-height: 26px;
  background: rgba(6, 10, 16, 0.5);
  color: white;
}
.wallet-copy {
  margin-left: 15px;
  cursor: pointer;
}
.wallet-disconnect {
  cursor: pointer;
}

.wallet-title2 {
  margin-top: 80px;
  color: #d5d8da;
  font-size: 13px;
  line-height: 15px;
  margin-bottom: 5px;
  text-align: left;
}
.balance {
  font-size: 24px;
  line-height: 28px;
  font-weight: 500;
  text-align: left;
  color: white;
}

.gas-title {
  font-size: 16px;
  color: #222222;
  text-align: left;
  margin-top: 50px;
}

.gas-layout {
  margin: 15px 0;
  justify-content: space-between;
  align-items: center;
}
.item-input {
  width: 55%;
}

.records-btn {
  background: #52DEFF;
  border: 1px solid #52DEFF;
  font-size: 17px;
  width: 120px;
}
.records-btn:focus,
.records-btn:hover {
  background: #52DEFFA0;
  border: 1px solid #52DEFFA0;
}

@media screen and (max-width: 500px) {
  .dialog_card {
    width: 90%;
    margin: 0 auto;
  }

  .wallet-title2 {
    margin-top: 60px;
  }

  .records-btn {
    font-size: 16px;
    width: 110px;
  }
}
</style>
