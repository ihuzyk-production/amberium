use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
use error::AmberiumError;

// Важливо: під час білда замінити це ID на реальне згенероване
// Для генерації використовуйте: solana-keygen new -o target/deploy/amberium_token-keypair.json
// і потім: solana address -k target/deploy/amberium_token-keypair.json
declare_id!("AmbeR1um11111111111111111111111111111111");

#[program]
pub mod amberium_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn mint(ctx: Context<Mint>, amount: u64) -> Result<()> {
        instructions::mint::handler(ctx, amount)
    }

    pub fn register_asset(
        ctx: Context<RegisterAsset>, 
        weight_grams: u64,
        certification_hash: [u8; 32],
        location: String,
    ) -> Result<()> {
        instructions::register_asset::handler(ctx, weight_grams, certification_hash, location)
    }
}
