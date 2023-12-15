<template>
  <div id="wallet">
    <button
      class="btn-connect"
      v-if="!this.account"
      @click.stop="connectWallet"
    >
      Connect
    </button>
    <div v-else class="user">
      <div class="metamask" @click.stop="onOpenCreate">
        <div class="metamask-img" />
        <div class="account">{{ this.accountShort }}</div>
      </div>
      <div class="favorite" @click.stop="goProfile"/>
    </div>

    <b-modal v-model="isShow"
             :canCancel="false"
             has-modal-card
             trap-focus>
      <WalletCard/>
    </b-modal>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { chains } from '@/store/state';
import WalletCard from './WalletCard.vue';
import {createWallet, getSessionKey} from "@/utils/Session";

export class UnsupportedChainIdError extends Error {
  constructor() {
    super('UnsupportedChainIdError: not support chain')
  }
}

const chain = 7011893062;
const chainID = `0x${chain.toString(16)}`;
const nodes = ['https://rpc.dencun-devnet-12.ethpandaops.io']
const explorers = ['https://explorer.dencun-devnet-12.ethpandaops.io'];

export default {
  name: "WalletComponent",
  data: () => ({
    isShow: false,
    contract: '',
  }),
  components: {
    WalletCard
  },
  computed: {
    account() {
      return this.$store.state.account;
    },
    accountShort() {
      return (
          this.account.substring(0, 6) +
          "..." +
          this.account.substring(
              this.account.length - 4,
              this.account.length
          )
      );
    },
  },
  methods: {
    ...mapActions(["setChainConfig", "setAccount", "setSessionKey", "setSessionAddr", "setSignature"]),
    goProfile() {
      this.$router.push({path: "/address/" + this.account});
    },
    onOpenCreate() {
      this.isShow = true;
    },
    connectWallet() {
      if (!window.ethereum) {
        this.$message.error('Can\'t setup the Devnet-12 network on metamask because window.ethereum is undefined');
        return;
      }
      this.login();
    },
    async handleChainChanged() {
      const newChainId = await window.ethereum.request({method: "eth_chainId"});
      if (chainID !== newChainId) {
        this.setSessionKey(null);
        this.setSessionAddr(null)
        this.setAccount(null);
        this.setSignature(null);
        this.isShow = false;
      }
    },
    async handleAccountsChanged() {
      this.setSignature(null);
      this.setSessionKey(null);
      this.setSessionAddr(null)
      this.setAccount(null);
      this.isShow = false;
    },
    async handleAccounts(accounts) {
      if (accounts.length === 0) {
        this.setSignature(null);
        this.setAccount(null);
        this.setSessionKey(null);
        this.setSessionAddr(null);
        console.warn(
            "MetaMask is locked or the user has not connected any accounts"
        );
        return;
      }

      const newChainId = await window.ethereum.request({method: "eth_chainId"});
      if (chainID !== newChainId) {
        throw new UnsupportedChainIdError();
      }

      this.setAccount(accounts[0]);
      await this.initSessionInfo();
    },
    async login() {
      window.ethereum
          .request({method: "eth_requestAccounts"})
          .then(this.handleAccounts)
          .catch(async (error) => {
            if (error.code === 4001) {
              this.$message.error('User rejected');
            } else if (error instanceof UnsupportedChainIdError) {
              const hasSetup = await this.setupNetwork();
              if (hasSetup) {
                await this.login();
              }
            } else {
              this.$message.error('Connect Error');
            }
          });
    },
    async setupNetwork() {
      const provider = window.ethereum;
      if (provider) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainID,
                chainName: 'Ethereum Devnet',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: nodes,
                blockExplorerUrls: explorers,
              },
            ],
          })
          const newChainId = await window.ethereum.request({method: "eth_chainId"});
          if (chainID !== newChainId) {
            this.$message.error('User rejected');
            return false;
          }
          return true;
        } catch (error) {
          this.$message.error('Failed to setup the network in Metamask');
          return false
        }
      } else {
        this.$message.error('Can\'t switch the network on metamask because window.ethereum is undefined');
        return false
      }
    },

    async initSessionInfo() {
      const sessionKey = getSessionKey(this.account);
      if (sessionKey) {
        // login success
        this.setSessionKey(sessionKey);
        const wallet = createWallet(sessionKey);
        this.setSessionAddr(wallet.address);
      } else {
        this.isShow = true;
      }
    },
  },
  async created() {
    const c = chains.find((v) => v.chainID === chainID);
    const config = JSON.parse(JSON.stringify(c));
    this.setChainConfig(config);
    this.contract = config.FileBoxController;

    // this.connectWallet();
    window.ethereum.on("chainChanged", this.handleChainChanged);
    window.ethereum.on("accountsChanged", this.handleAccountsChanged);
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

.metamask {
  height: 38px;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 4px 4px 8px;
  background: #FFFFFF;
  border: 1px solid #E8E6F2;
  cursor: pointer;
}
.metamask-img {
  width: 24px;
  height: 24px;
  background-image: url("../assets/metamask.svg");
  background-repeat:no-repeat;
  background-size:100% 100%;
  -moz-background-size:100% 100%;
}
.account {
  font-size: 14px;
  line-height: 30px;
  background: #ECF0F9;
  border-radius: 12px;
  border: none;
  padding: 0 8px;
  text-align: center;
  margin-left: 10px;
}

.favorite{
  cursor: pointer;
  height: 38px;
  width: 38px;
  margin-left: 15px;
  padding: 0;
  background-image: url("../assets/user.png");
  background-repeat:no-repeat;
  background-size:100% 100%;
  -moz-background-size:100% 100%;
}

.btn-connect {
  transition: all 0.1s ease 0s;
  width: 100px;
  height: 38px;
  color: #ffffff;
  font-size: 19px;
  border: 0;
  background: #52DEFF;
  border-radius: 32px;
  cursor: pointer;
}
.btn-connect:hover {
  background-color: #52DEFF90;
  border: 0;
}
</style>
