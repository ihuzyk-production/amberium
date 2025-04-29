use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
#[derive(Default)]
pub struct TokenConfig {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub total_asset_weight_grams: u64,
    pub total_supply: u64,
    pub price_usd_cents: u64,
    pub is_initialized: bool,
}

#[account]
pub struct AssetVerification {
    pub authority: Pubkey,
    pub asset_id: [u8; 32],      // Unique ID for physical amber piece
    pub weight_grams: u64,       // Weight of amber piece in grams
    pub certification_hash: [u8; 32], // Hash of certification document
    pub location: [u8; 64],      // Storage location
    pub verification_status: u8, // Using constants for status
    pub verification_date: i64,  // Unix timestamp
    pub verifier: Pubkey,        // Who verified this asset
}

impl TokenConfig {
    pub const SPACE: usize = 8 + // discriminator
                            32 + // authority
                            32 + // token_mint
                            8 +  // total_asset_weight_grams
                            8 +  // total_supply
                            8 +  // price_usd_cents
                            1;   // is_initialized
}

impl AssetVerification {
    pub const SPACE: usize = 8 +  // discriminator
                            32 +  // authority
                            32 +  // asset_id
                            8 +   // weight_grams
                            32 +  // certification_hash
                            64 +  // location
                            1 +   // verification_status
                            8 +   // verification_date
                            32;   // verifier
}
