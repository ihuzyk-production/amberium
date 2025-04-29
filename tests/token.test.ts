import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { AmberiumToken } from '../target/types/amberium_token';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { expect } from 'chai';

describe('amberium-token', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AmberiumToken as Program<AmberiumToken>;
  
  // Test accounts
  const tokenConfig = Keypair.generate();
  const assetId = Keypair.generate();
  let tokenMint: PublicKey;
  let tokenAuthority: PublicKey;
  let assetVerification: PublicKey;
  let recipientTokenAccount: PublicKey;
  
  it('Initializes the token', async () => {
    // Derive the token mint PDA
    [tokenMint] = await PublicKey.findProgramAddressSync(
      [Buffer.from("amberium-token-mint")],
      program.programId
    );
    
    // Derive token authority PDA
    [tokenAuthority] = await PublicKey.findProgramAddressSync(
      [Buffer.from("amberium-authority")],
      program.programId
    );
    
    // Initialize token
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
    
    console.log("Your transaction signature", tx);
    
    // Fetch the created token config account
    const configAccount = await program.account.tokenConfig.fetch(tokenConfig.publicKey);
    
    // Verify the account was initialized correctly
    expect(configAccount.authority.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(configAccount.tokenMint.toString()).to.equal(tokenMint.toString());
    expect(configAccount.totalAssetWeightGrams.toNumber()).to.equal(0);
    expect(configAccount.totalSupply.toNumber()).to.equal(0);
    expect(configAccount.priceUsdCents.toNumber()).to.equal(100); // $1.00
    expect(configAccount.isInitialized).to.be.true;
  });
  
  it('Registers an amber asset', async () => {
    // Derive the asset verification PDA
    [assetVerification] = await PublicKey.findProgramAddressSync(
      [Buffer.from("amber-asset-verification"), assetId.publicKey.toBuffer()],
      program.programId
    );
    
    // Sample certification hash (32 bytes)
    const certificationHash = Array(32).fill(0).map(() => Math.floor(Math.random() * 256));
    
    // Register an asset
    const tx = await program.methods
      .registerAsset(
        new anchor.BN(1000), // 1000 grams (1 kg)
        certificationHash,
        "Vault A, Shelf 3, Box 12"
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
    
    console.log("Asset registration tx", tx);
    
    // Fetch the verification account
    const verificationAccount = await program.account.assetVerification.fetch(assetVerification);
    
    // Verify the asset was registered correctly
    expect(verificationAccount.authority.toString()).to.equal(provider.wallet.publicKey.toString());
    expect(verificationAccount.weightGrams.toNumber()).to.equal(1000);
    expect(verificationAccount.verificationStatus).to.equal(0); // Pending
    
    // Fetch the updated token config
    const updatedConfig = await program.account.tokenConfig.fetch(tokenConfig.publicKey);
    
    // Verify total asset weight was updated
    expect(updatedConfig.totalAssetWeightGrams.toNumber()).to.equal(1000);
  });
  
  it('Mints tokens', async () => {
    // Get the associated token account for the wallet
    recipientTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint,
      owner: provider.wallet.publicKey
    });
    
    // Mint tokens
    const tx = await program.methods
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
    
    console.log("Mint transaction", tx);
    
    // Check token account balance
    const tokenAccount = await getAccount(provider.connection, recipientTokenAccount);
    
    // Verify 100 tokens were minted
    expect(Number(tokenAccount.amount)).to.equal(100);
    
    // Fetch the updated token config
    const updatedConfig = await program.account.tokenConfig.fetch(tokenConfig.publicKey);
    
    // Verify total supply was updated
    expect(updatedConfig.totalSupply.toNumber()).to.equal(100);
  });
  
  it('Fails to mint more tokens than backed assets', async () => {
    // Try to mint more tokens than we have backed with assets
    try {
      await program.methods
        .mint(new anchor.BN(1000)) // Try to mint 1000 tokens (already have 100, max is 1000)
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
      
      // If we get here, the test failed
      expect.fail("Should not allow minting more tokens than backed assets");
    } catch (e) {
      // We expect this to fail
      expect(e).to.be.an("error");
      expect(e.message).to.include("ExceedsBackedAssets");
    }
  });
});
