use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::{constants::*, state::TokenConfig, error::AmberiumError};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [TOKEN_MINT_SEED],
        bump,
        payer = authority,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = token_authority.key(),
    )]
    pub token_mint: Account<'info, Mint>,

    /// CHECK: This is the PDA that will have authority over the token
    #[account(
        seeds = [TOKEN_AUTHORITY_SEED],
        bump,
    )]
    pub token_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = TokenConfig::SPACE,
    )]
    pub token_config: Account<'info, TokenConfig>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let token_config = &mut ctx.accounts.token_config;
    token_config.authority = ctx.accounts.authority.key();
    token_config.token_mint = ctx.accounts.token_mint.key();
    token_config.total_asset_weight_grams = 0;
    token_config.total_supply = 0;
    token_config.price_usd_cents = INITIAL_PRICE_USD_CENTS;
    token_config.is_initialized = true;

    msg!("Initialized Amberium (AMB) token");
    msg!("Token mint: {}", ctx.accounts.token_mint.key());
    msg!("Initial price: ${}.{:02}", 
        INITIAL_PRICE_USD_CENTS / 100, 
        INITIAL_PRICE_USD_CENTS % 100);

    Ok(())
} 