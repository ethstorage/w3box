<template>
  <el-card class="dialog_card">
    <div class="dialog_item">
      <p v-if="this.created" class="item-title">Login Proxy Account</p>
      <p v-else class="item-title">Create Proxy Account</p>
      <i class="el-icon-close item-close" @click="$parent.close()"/>
    </div>

    <div class="dialog-msg">
      W3Box uses a proxy account to upload files - this account is only stored locally
      and controlled entirely by the address you are currently connected to.
    </div>
    <div v-if="!this.created" class="dialog-msg" style="margin-top: 10px">
      Creating a proxy account requires your authorization signature and submitting relevant information to the chain.
    </div>

    <el-input v-if="!isLogined" class="input-password" type="password"
              placeholder="Enter password" v-model="input"/>

    <el-card v-if="isLogined" class="wallet-card">
      <div class="deploy-success-layout">
        <i class="el-icon-success deploy-icon"/>
        <span class="deploy-title">Login Success</span>
      </div>
    </el-card>
    <el-button v-else-if="this.created" type="warning" round class="records-btn"
               :loading='loading' @click="onLogin">
      Login
    </el-button>
    <el-button v-else type="warning" round class="records-btn"
               :loading='loading' @click="onRegister">
      Create
    </el-button>
  </el-card>
</template>

<script>
const chain = 7011893062;

import {mapActions} from "vuex";
import {
  createSession, encryptSession,
  querySessionKey, saveSessionKey, signSeed
} from "@/utils/Session";

export default {
  name: "WalletCardComponent",
  props: ['canCancel'],
  data: () => ({
    sessionResult: null,
    isLogined: false,
    created: false,

    input: '',
    loading: false,
  }),
  computed: {
    account() {
      return this.$store.state.account;
    },
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {FileBoxController} = this.$store.state.chainConfig;
        return FileBoxController;
      }
      return null;
    },
    signature() {
      return this.$store.state.signature;
    }
  },
  created() {
    this.initData();
  },
  methods: {
    ...mapActions(["setSessionKey", "setSessionAddr", "setSignature"]),
    async onRegister() {
      const password = this.input;
      if (!password) {
        this.$message.error('Invalid password');
        return;
      }
      if (!this.signature) {
        this.$message.error('Need signature');
        return;
      }

      this.loading = true;
      const result = await createSession(this.contract, this.signature, password)
          .catch(() => {
            this.loading = false;
          });
      this.loading = false;
      if (result) {
        this.setSessionKey(result.sessionKey);
        this.setSessionAddr(result.address);
        saveSessionKey(this.account, result.sessionKey);

        this.$notify({
          title: 'Success',
          message: 'Register Success',
          type: 'success'
        });
        this.$parent.close();
      } else {
        this.$message.error('Register Fail!');
      }
    },
    async onLogin() {
      const password = this.input;
      if (!password) {
        this.$message.error('Invalid password');
        return;
      }
      if (!this.signature) {
        this.$message.error('Need signature');
        return;
      }

      const sessionKey = await encryptSession(password, this.signature, this.sessionResult.iv, this.sessionResult.encrypt);
      if (sessionKey) {
        this.setSessionKey(sessionKey);
        this.setSessionAddr(this.sessionResult.address);
        saveSessionKey(this.account, sessionKey);

        this.$notify({
          title: 'Success',
          message: 'Login Success',
          type: 'success'
        });
        this.$parent.close();
      } else {
        this.$message.error('Password Error');
      }
    },
    async initData() {
      if (this.$store.state.sessionKey) {
        this.isLogined = true;
      } else {
        this.sessionResult = await querySessionKey(this.contract);
        this.created = this.sessionResult !== undefined;

        if (!this.signature) {
          const sign = await signSeed(this.account, chain);
          if (!sign) {
            this.$message.error('User rejected sign');
            return;
          }
          this.setSignature(sign);
        }
      }
    }
  },
};
</script>

<style scoped>
.dialog_card {
  position: relative;
  border-radius: 16px;
  width: 450px;
}

.dialog_item {
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

.dialog-msg {
  margin-top: 35px;
  text-align: left;
  font-size: 16px;
  color: #222222;
  line-height: 20px;
}


.wallet-card {
  margin-top: 30px;
  border-radius: 16px;
}

.input-password {
  width: 75%;
  margin-bottom: 25px;
  margin-top: 50px;
}

.records-btn {
  background: #52DEFF;
  border: 1px solid #52DEFF;
  font-size: 17px;
  width: 160px;
  margin-bottom: 15px;
}

.records-btn:focus,
.records-btn:hover {
  background: #52DEFFA0;
  border: 1px solid #52DEFFA0;
}
.records-btn:disabled,
.records-btn:disabled:hover {
  background: rgba(104, 141, 150, 0.31);
  border: 0;
}

.deploy-success-layout {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
.deploy-icon {
  font-size: 45px;
  color: #52DEFF;
  margin: 15px;
}
.deploy-title {
  font-size: 23px;
  color: #52DEFF;
}

@media screen and (max-width: 500px) {
  .dialog_card {
    width: 90%;
    margin: 0 auto;
  }

  .deploy-icon {
    font-size: 50px;
  }

  .records-btn {
    font-size: 16px;
    width: 120px;
  }
}
</style>
