const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, SystemProgram } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } = require("@solana/spl-token");
const { BN } = require("@coral-xyz/anchor");
const { assert } = require("chai");

describe("amberium", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.amberium;
  const wallet = provider.wallet;
  
  let mint;
  let userTokenAccount;
  let admin;
  let mintAuthority;
  
  // Initial price is $1 per 1 token (which represents 1 carat of amber)
  const INITIAL_SUPPLY = new BN(1000000); // 1 million tokens
  
  before(async () => {
    // Generate a new mint keypair
    mint = Keypair.generate();
    
    // Find PDA for admin
    const [adminPda, adminBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("admin"),
        mint.publicKey.toBuffer(),
      ],
      program.programId
    );
    admin = adminPda;
    
    // Find PDA for mint authority
    const [mintAuthorityPda, mintAuthorityBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("mint_authority"),
        mint.publicKey.toBuffer(),
      ],
      program.programId
    );
    mintAuthority = mintAuthorityPda;
    
    // Create associated token account for the user
    userTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      wallet.publicKey
    );
  });
  
  it("Initializes the Amberium token", async () => {
    // Initialize the token with initial supply
    const tx = await program.methods
      .initialize(INITIAL_SUPPLY)
      .accounts({
        authority: wallet.publicKey,
        admin: admin,
        mintAuthority: mintAuthority,
        mint: mint.publicKey,
        tokenAccount: userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();
    
    console.log("Your transaction signature", tx);
    
    // Fetch the token account to check balance
    const tokenAccount = await provider.connection.getTokenAccountBalance(
      userTokenAccount
    );
    
    // Verify that the initial supply was minted correctly
    assert.equal(
      tokenAccount.value.amount,
      INITIAL_SUPPLY.toString(),
      "Initial supply should match"
    );
    
    // Fetch the mint info
    const mintInfo = await provider.connection.getAccountInfo(mint.publicKey);
    console.log("Mint created successfully:", mintInfo !== null);
  });
  
  it("Mints new tokens based on newly mined amber", async () => {
    // Amount of newly mined amber in carats
    const newAmberAmount = new BN(5000);
    
    // Mint new tokens
    const tx = await program.methods
      .mintTokens(newAmberAmount)
      .accounts({
        authority: wallet.publicKey,
        admin: admin,
        mintAuthority: mintAuthority,
        mint: mint.publicKey,
        tokenAccount: userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log("Mint transaction signature", tx);
    
    // Fetch updated token balance
    const tokenAccount = await provider.connection.getTokenAccountBalance(
      userTokenAccount
    );
    
    // Verify that the new tokens were minted correctly
    // Total should be initial supply + newly minted tokens
    const expectedTotal = INITIAL_SUPPLY.add(newAmberAmount);
    assert.equal(
      tokenAccount.value.amount,
      expectedTotal.toString(),
      "Token balance should reflect the new minting"
    );
    
    console.log("New token balance:", tokenAccount.value.amount);
    console.log("Each token equals 1 carat of amber");
    console.log("Initial price: $1 per token");
  });
});
