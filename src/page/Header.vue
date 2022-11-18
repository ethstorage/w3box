<template>
  <b-navbar class="nav-container">
    <template #brand>
      <b-navbar-item tag="router-link" :to="{ path: '/' }">
        <img class="logo" src="../assets/logo.png">
      </b-navbar-item>
    </template>
    <template #end>
      <b-navbar-item class="connection" tag="div">
        <Wallet/>
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script>
import Wallet from "@/components/Wallet";

export default {
  name: 'Header',
  components: {
    Wallet
  }
}
</script>

<style lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/_all";

$family-sans-serif: KGBrokenVesselsSketch;
// Import Bulma and Buefy styless
@import "~bulma";
@import "~buefy/src/scss/buefy";

.nav-container {
  background: transparent;
}

.connection {
  cursor: default !important;
}

.connection:hover {
  background-color: transparent !important;
}

.logo {
  min-height: 36px;
  max-height: 36px;
}

@media screen and (max-width: 420px) {
  .logo {
    min-height: 25px;
  }
  .navbar-menu {
    background: #F9F8FD;
    border-radius: 10px;
  }
}
</style>
