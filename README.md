
# 🔶 Amberium (AMB) Token

![Solana](https://img.shields.io/badge/Solana-20232A?style=for-the-badge&logo=solana&logoColor=3C68FF)  
![Anchor](https://img.shields.io/badge/Anchor-3DBF61?style=for-the-badge&logo=anchor&logoColor=white)  
![Token](https://img.shields.io/badge/SPL_Token-EEA01C?style=for-the-badge)  
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

Amberium (AMB) is an innovative token on the Solana blockchain that revolutionizes the amber market through the tokenization of real physical assets. Each AMB token represents exactly 1 carat of certified amber.

## 💡 Problem & Solution

**Problem**: The traditional amber market suffers from a lack of transparency, traceability, and liquidity.

**Our Solution**: Amberium creates a digital representation of amber on the Solana blockchain, providing:
- ✅ Transparent origin verification system  
- ✅ Global liquidity and instant transactions  
- ✅ Fractional ownership of valuable assets  
- ✅ Protection against counterfeiting  

## 🪙 Token Specifications

- **Peg**: 1 AMB = 1 carat of amber  
- **Initial Price**: $1 per AMB  
- **Standard**: SPL token on Solana  
- **Issuance**: Controlled, backed by verified amber extraction  
- **Functionality**: Transferable, storable, and usable within DeFi ecosystems  

## 🛠️ Technologies

- **Blockchain**: Solana (chosen for speed and low fees)  
- **Smart Contract**: Developed using Rust and the Anchor Framework  
- **Client**: JavaScript using Solana Web3.js and SPL-Token libraries  

## 📋 Prerequisites

To work with the project, you’ll need:
- [Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools)  
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)  
- [Node.js](https://nodejs.org/) (v14+)  
- [Yarn](https://yarnpkg.com/)  

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/ihuzyk-production/amberium.git
cd amberium

# Install dependencies
yarn install

# Generate a Solana wallet (if you don’t have one)
solana-keygen new -o ~/.config/solana/id.json

# Set up the devnet environment
solana config set --url devnet

# Request test SOL
solana airdrop 2
```

### Compile & Deploy

```bash
# Compile the smart contract
anchor build

# Deploy to devnet
anchor deploy
```

### Token Operations

```bash
# Initialize a new token with a supply of 1 million
node app/direct-client.js init 1000000

# Mint 5000 new tokens backed by verified amber extraction
node app/direct-client.js mint 5000
```

## 🧪 Testing

```bash
# Run automated tests
anchor test
```

## 📐 Architecture

### Smart Contract (Rust)

Key components of the smart contract:

- **Initialize**: Creates a new token with initial supply  
- **MintTokens**: Mints new tokens upon verified amber extraction  
- **AdminConfig**: PDA for storing admin rights  
- **MintAuthority**: PDA for controlling token issuance  

### Client Side (JavaScript)

- **amberium-client.js**: Client with Anchor IDL support  
- **direct-client.js**: Alternative client with direct calls  

## 🔍 Demo

Active Amberium token instance on devnet:  
- Program ID: `86ouczdz4eVPC3TCvUMTB1VCXE3Ti3pNn41a9ztRrUTd`  
- Mint Address: Generated during initialization  

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*© Amberium 2025*
