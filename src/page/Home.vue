<template>
  <div class="home">
    <img class="home-logo" src="../assets/home.png"/>
    <p class="title">
      The File Hosting Service on Web3Q
    </p>
    <w3q-deployer multiple :fileContract="contract" style="width: 500px"/>
  </div>
</template>

<script>
import W3qDeployer from '@/components/w3q-deployer.vue';

export default {
  name: 'Home',
  components: {W3qDeployer},
  computed: {
    contract() {
      if (this.$store.state.chainConfig && this.$store.state.chainConfig.chainID) {
        const {FileBoxController} = this.$store.state.chainConfig;
        return FileBoxController;
      }
      return null;
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
</style>
