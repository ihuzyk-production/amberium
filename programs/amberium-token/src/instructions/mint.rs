use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, MintTo, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::{constants::*, state::TokenConfig, error::AmberiumError};

#[derive(Accounts)]
pub struct Mint<'info> {
    #[account(
        mut,
        constraint = token_config.authority == authority.key() @ AmberiumError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [TOKEN_MINT_SEED],
        bump,
    )]
    pub token_mint: Account<'info, Mint>,

    /// CHECK: This is the PDA that has authority over the token
    #[account(
        seeds = [TOKEN_AUTHORITY_SEED],
        bump,
    )]
    pub token_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = token_config.is_initialized == true,
        constraint = token_config.token_mint == token_mint.key(),
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: The recipient of the tokens being minted
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Mint>, amount: u64) -> Result<()> {
    let token_config = &mut ctx.accounts.token_config;
    
    // Ensure we have backed assets for the amount being minted
    require!(
        token_config.total_asset_weight_grams > 0,
        AmberiumError::ExceedsBackedAssets
    );
    
    // Calculate number of tokens we can mint based on backed assets
    // For simplicity, each gram of amber backs 1 token initially
    let backed_supply = token_config.total_asset_weight_grams;
    let potential_supply = token_config.total_supply.saturating_add(amount);
    
    require!(
        potential_supply <= backed_supply,
        AmberiumError::ExceedsBackedAssets
    );
    
    // Mint tokens to the recipient
    let bump = *ctx.bumps.get("token_authority").unwrap();
    let auth_seeds = &[TOKEN_AUTHORITY_SEED, &[bump]];
    let signer = &[&auth_seeds[..]];
    
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.token_authority.to_account_info(),
            },
            signer,
        ),
        amount,
    )?;
    
    // Update supply
    token_config.total_supply = token_config.total_supply.saturating_add(amount);
    
    msg!("Minted {} Amberium (AMB) tokens", amount);
    msg!("New total supply: {}", token_config.total_supply);
    msg!("Recipient: {}", ctx.accounts.recipient.key());
    
    Ok(())
} 