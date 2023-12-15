<template>
  <div class="home">
    <img class="home-logo" src="../assets/home.png"/>
    <p class="title">
      The File Hosting Service on EthStorage
    </p>
    <w3q-deployer multiple
                  :fileContract="contract"
                  :fdContract="fdContract"
                  :account="account"
                  :aaAccount="aaAccount"
                  class="drop"/>
  </div>
</template>

<script>
import W3qDeployer from '@/components/w3q-deployer.vue';

export default {
  name: 'HomePage',
  components: {W3qDeployer},
  computed: {
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {FileBoxController} = this.$store.state.chainConfig;
        return FileBoxController;
      }
      return null;
    },
    fdContract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {FDContract} = this.$store.state.chainConfig;
        return FDContract;
      }
      return null;
    },
    account() {
      return this.$store.state.account;
    },
    aaAccount() {
      return this.$store.state.sessionAddr;
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.home-logo {
  margin-top: 20px;
  width: 230px;
}

.title {
  font-size: 25px;
  color: #333333;
  margin-bottom: 55px;
  margin-top: 30px;
  line-height: 50px;
}

.drop {
  width: 550px;
  margin: 0 auto;
}

.btn-create {
  transition: all 0.1s ease 0s;
  width: 180px;
  height: 52px;
  color: #ffffff;
  font-size: 18px;
  border: 0;
  background: #52DEFF;
  border-radius: 36px;
  cursor: pointer;
}

.btn-create:hover {
  background-color: #52DEFF90;
  border: 0;
}

@media screen and (max-width: 500px) {
  .home-logo {
    margin-top: 35px;
    width: 180px;
  }

  .title {
    font-size: 18px;
    margin-bottom: 30px;
    margin-top: 30px;
    line-height: 30px;
  }

  .drop {
    width: 98%
  }

  .phone {
    display: none;
  }
}
</style>
