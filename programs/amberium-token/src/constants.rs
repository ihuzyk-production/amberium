pub const TOKEN_NAME: &str = "Amberium";
pub const TOKEN_SYMBOL: &str = "AMB";
pub const TOKEN_DECIMALS: u8 = 9;
pub const INITIAL_PRICE_USD_CENTS: u64 = 100; // $1.00 per token

// Verification status constants
pub const VERIFICATION_PENDING: u8 = 0;
pub const VERIFICATION_APPROVED: u8 = 1;
pub const VERIFICATION_REJECTED: u8 = 2;

// PDA seeds
pub const TOKEN_MINT_SEED: &[u8] = b"amberium-token-mint";
pub const TOKEN_AUTHORITY_SEED: &[u8] = b"amberium-authority";
pub const ASSET_VERIFICATION_SEED: &[u8] = b"amber-asset-verification";
