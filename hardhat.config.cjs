// Hardhat configuration for optional Ethereum-compatible testnet deployment
// Run: npx hardhat compile (when Hardhat CLI is installed)
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.ETH_RPC_URL || "",
      accounts: process.env.ETH_SIGNER_PRIVATE_KEY
        ? [process.env.ETH_SIGNER_PRIVATE_KEY]
        : [],
    },
  },
};
