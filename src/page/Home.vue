<template>
  <div class="home">
    <img class="home-logo" src="../assets/home.png"/>
    <p class="title">
      The File Hosting Service on EthStorage
    </p>
    <w3q-deployer multiple :fileContract="contract" :flatDirectory="flatDirectory" :account="account" class="drop"/>
  </div>
</template>

<script>
import W3qDeployer from '@/components/w3q-deployer.vue';

export default {
  name: 'HomeComponent',
  components: {W3qDeployer},
  computed: {
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {FileBoxController} = this.$store.state.chainConfig;
        return FileBoxController;
      }
      return null;
    },
    flatDirectory() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {FlatDirectory} = this.$store.state.chainConfig;
        return FlatDirectory;
      }
      return null;
    },
    account() {
      return this.$store.state.account;
    }
  }
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
  margin-top: 35px;
  width: 230px;
}

.title {
  font-size: 30px;
  color: #333333;
  margin-bottom: 55px;
  margin-top: 30px;
  line-height: 50px;
}

.drop {
  width: 600px
}
@media screen and (max-width: 500px) {
  .home-logo {
    margin-top: 35px;
    width: 180px;
  }

  .title {
    font-size: 22px;
    margin-bottom: 30px;
    margin-top: 30px;
    line-height: 30px;
  }

  .drop {
    width: 98%
  }
}
</style>
