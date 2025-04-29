use anchor_lang::prelude::*;
use crate::{constants::*, state::{TokenConfig, AssetVerification}, error::AmberiumError};

#[derive(Accounts)]
pub struct RegisterAsset<'info> {
    #[account(
        mut,
        constraint = token_config.authority == authority.key() @ AmberiumError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = token_config.is_initialized == true,
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        init,
        seeds = [ASSET_VERIFICATION_SEED, asset_id.key().as_ref()],
        bump,
        payer = authority,
        space = AssetVerification::SPACE,
    )]
    pub asset_verification: Account<'info, AssetVerification>,

    /// CHECK: This is just used to derive a unique PDA for the asset
    pub asset_id: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<RegisterAsset>, 
    weight_grams: u64,
    certification_hash: [u8; 32],
    location: String,
) -> Result<()> {
    require!(weight_grams > 0, AmberiumError::InvalidAssetData);
    require!(location.len() <= 64, AmberiumError::InvalidAssetData);
    
    let asset = &mut ctx.accounts.asset_verification;
    let token_config = &mut ctx.accounts.token_config;
    
    // Set asset verification details
    asset.authority = ctx.accounts.authority.key();
    asset.asset_id = ctx.accounts.asset_id.key().to_bytes();
    asset.weight_grams = weight_grams;
    asset.certification_hash = certification_hash;
    
    // Copy location string to fixed-size array
    let mut location_bytes = [0u8; 64];
    for (i, byte) in location.as_bytes().iter().enumerate() {
        if i < 64 {
            location_bytes[i] = *byte;
        }
    }
    asset.location = location_bytes;
    
    // Set initial verification status
    asset.verification_status = VERIFICATION_PENDING;
    asset.verification_date = Clock::get()?.unix_timestamp;
    asset.verifier = ctx.accounts.authority.key();
    
    // Update token config with new asset weight
    token_config.total_asset_weight_grams = token_config.total_asset_weight_grams.saturating_add(weight_grams);
    
    msg!("Registered {} grams of amber", weight_grams);
    msg!("Total backed assets: {} grams", token_config.total_asset_weight_grams);
    msg!("Asset ID: {}", ctx.accounts.asset_id.key());
    
    Ok(())
} 