const anchor = require('@coral-xyz/anchor');
const { Program } = require('@coral-xyz/anchor');
const { PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import the IDL
const idl = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../target/idl/amberium_token.json'),
    'utf8'
  )
);

async function main() {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Initialize a connection to the cluster
  console.log('Connecting to', provider.connection.rpcEndpoint);
  
  // Create a new program instance
  const programId = new PublicKey(process.env.PROGRAM_ID);
  const program = new Program(idl, programId, provider);
  
  // Derive the token authority PDA
  const [tokenAuthority, tokenAuthorityBump] = await PublicKey.findProgramAddressSync(
    [Buffer.from("amberium-authority")],
    program.programId
  );
  
  // Derive the token mint PDA
  const [tokenMint, tokenMintBump] = await PublicKey.findProgramAddressSync(
    [Buffer.from("amberium-token-mint")],
    program.programId
  );
  
  // Derive the token configuration account
  const tokenConfig = Keypair.generate();
  
  console.log('Program ID:', program.programId.toString());
  console.log('Authority:', provider.wallet.publicKey.toString());
  console.log('Token Authority PDA:', tokenAuthority.toString());
  console.log('Token Mint PDA:', tokenMint.toString());
  console.log('Token Config:', tokenConfig.publicKey.toString());

  try {
    // Initialize the token
    console.log('Initializing Amberium token...');
    const tx = await program.methods
      .initialize()
      .accounts({
        authority: provider.wallet.publicKey,
        tokenMint: tokenMint,
        tokenAuthority: tokenAuthority,
        tokenConfig: tokenConfig.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([tokenConfig])
      .rpc();
    
    console.log('Transaction signature:', tx);
    console.log('Amberium token initialized successfully!');
    
    // Create a sample amber asset for testing
    console.log('Registering a sample amber asset...');
    
    // Generate a random asset ID
    const assetId = Keypair.generate();
    
    // Derive the asset verification PDA
    const [assetVerification, assetVerificationBump] = await PublicKey.findProgramAddressSync(
      [Buffer.from("amber-asset-verification"), assetId.publicKey.toBuffer()],
      program.programId
    );
    
    // Sample certification hash (32 bytes)
    const certificationHash = Array(32).fill(0).map(() => Math.floor(Math.random() * 256));
    
    // Register the asset
    const registerTx = await program.methods
      .registerAsset(
        new anchor.BN(1000), // 1000 grams (1 kg) of amber
        certificationHash,
        "Vault A, Shelf 3, Box 12" // Location string
      )
      .accounts({
        authority: provider.wallet.publicKey,
        tokenConfig: tokenConfig.publicKey,
        assetVerification: assetVerification,
        assetId: assetId.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log('Asset registration transaction:', registerTx);
    console.log('Asset registered successfully!');
    console.log('Asset ID:', assetId.publicKey.toString());
    
    // Mint some tokens
    console.log('Minting Amberium tokens...');
    
    // Get the associated token account for the wallet
    const recipientTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint,
      owner: provider.wallet.publicKey
    });
    
    const mintTx = await program.methods
      .mint(new anchor.BN(100)) // Mint 100 tokens
      .accounts({
        authority: provider.wallet.publicKey,
        tokenMint: tokenMint,
        tokenAuthority: tokenAuthority,
        tokenConfig: tokenConfig.publicKey,
        recipientTokenAccount: recipientTokenAccount,
        recipient: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    console.log('Mint transaction:', mintTx);
    console.log('Successfully minted 100 AMB tokens to:', provider.wallet.publicKey.toString());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
