# Amberium Token Usage Guide

This document describes how to interact with the Amberium token contract.

## Prerequisites

- Solana CLI tools installed
- Anchor framework installed
- Node.js and Yarn
- A Solana wallet with SOL for transactions

## Deployment

### Local Development

```bash
# Build the program
anchor build

# Test locally
anchor test

# Deploy to localnet
anchor deploy
```

### Devnet Deployment

```bash
# Set Solana to devnet
solana config set --url https://api.devnet.solana.com

# Request airdrop for testing (if needed)
solana airdrop 2

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Using the Deployment Script

The `scripts/deploy_token.js` script performs a complete deployment:

```bash
# Set environment variables
export ANCHOR_WALLET=~/.config/solana/id.json
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"

# Run the script
node scripts/deploy_token.js
```

## Program Instructions

### 1. Initialize Token

Creates the token mint and configuration.

```javascript
await program.methods
  .initialize()
  .accounts({
    authority: walletPublicKey,
    tokenMint: tokenMintPDA,
    tokenAuthority: tokenAuthorityPDA,
    tokenConfig: tokenConfigKeypair.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  })
  .signers([tokenConfigKeypair])
  .rpc();
```

### 2. Register Asset

Registers a physical amber asset to back the tokens.

```javascript
await program.methods
  .registerAsset(
    new anchor.BN(weightInGrams),
    certificationHash,
    storageLocation
  )
  .accounts({
    authority: walletPublicKey,
    tokenConfig: tokenConfigPublicKey,
    assetVerification: assetVerificationPDA,
    assetId: assetIdPublicKey,
    systemProgram: SystemProgram.programId,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  })
  .rpc();
```

### 3. Mint Tokens

Mints new tokens backed by registered assets.

```javascript
await program.methods
  .mint(new anchor.BN(amountToMint))
  .accounts({
    authority: walletPublicKey,
    tokenMint: tokenMintPDA,
    tokenAuthority: tokenAuthorityPDA,
    tokenConfig: tokenConfigPublicKey,
    recipientTokenAccount: recipientTokenAccountAddress,
    recipient: recipientPublicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  })
  .rpc();
```

## Account Management

### Finding PDAs

```javascript
// Token Mint PDA
const [tokenMint] = await PublicKey.findProgramAddressSync(
  [Buffer.from("amberium-token-mint")],
  programId
);

// Token Authority PDA
const [tokenAuthority] = await PublicKey.findProgramAddressSync(
  [Buffer.from("amberium-authority")],
  programId
);

// Asset Verification PDA
const [assetVerification] = await PublicKey.findProgramAddressSync(
  [Buffer.from("amber-asset-verification"), assetId.toBuffer()],
  programId
);
```

## Common Operations

### Check Token Supply

```javascript
const tokenConfig = await program.account.tokenConfig.fetch(tokenConfigAddress);
console.log("Total Supply:", tokenConfig.totalSupply.toString());
console.log("Backed Assets (g):", tokenConfig.totalAssetWeightGrams.toString());
```

### Check Asset Verification Status

```javascript
const assetVerification = await program.account.assetVerification.fetch(assetVerificationAddress);
console.log("Status:", assetVerification.verificationStatus);
console.log("Weight (g):", assetVerification.weightGrams.toString());
```

### Check Token Balance

```javascript
const tokenAccount = await getAccount(connection, tokenAccountAddress);
console.log("Balance:", tokenAccount.amount.toString());
```
