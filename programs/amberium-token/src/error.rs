use anchor_lang::prelude::*;

#[error_code]
pub enum AmberiumError {
    #[msg("Unauthorized access to this operation")]
    Unauthorized,
    
    #[msg("Invalid mint authority")]
    InvalidMintAuthority,
    
    #[msg("Invalid asset verification data")]
    InvalidAssetData,
    
    #[msg("Asset verification already exists")]
    AssetVerificationExists,
    
    #[msg("Invalid verification status")]
    InvalidVerificationStatus,
    
    #[msg("Amount exceeds available backed assets")]
    ExceedsBackedAssets,
    
    #[msg("Insufficient tokens")]
    InsufficientTokens,
}
