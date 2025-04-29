# Amberium (AMB) Token

Amberium is a Solana token backed by physical amber assets. Each token represents a share of the verified amber stored in secure vaults.

## Features

- **Asset-Backed Value**: Each AMB token is backed by physical amber
- **Verifiable Assets**: Physical amber pieces are registered with certification details
- **Transparent Supply**: Token supply limited by verified physical assets
- **Initial Price**: $1.00 USD per token

## Quick Start

### Prerequisites

- Solana CLI tools
- Anchor Framework
- Node.js & Yarn

### Setup

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Running the Deployment Script

```bash
# Set environment variables
export ANCHOR_WALLET=~/.config/solana/id.json
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"

# Run deploy script
node scripts/deploy_token.js
```

## Project Structure

- `/programs/amberium-token`: Solana program code
- `/app`: Optional frontend application
- `/scripts`: Deployment and utility scripts
- `/tests`: Program tests
- `/migrations`: Anchor migrations

## Asset Verification Process

1. Admin registers physical amber assets with details
2. Each gram of amber backs a specific number of tokens
3. Tokens can only be minted if they're backed by verified assets

## License

[MIT](LICENSE)
