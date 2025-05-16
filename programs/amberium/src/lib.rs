use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("86ouczdz4eVPC3TCvUMTB1VCXE3Ti3pNn41a9ztRrUTd");

#[program]
pub mod amberium {
    use super::*;

    // Initialize the Amberium token mint and admin authority
    pub fn initialize(ctx: Context<Initialize>, initial_supply: u64) -> Result<()> {
        let admin = &mut ctx.accounts.admin;
        
        // Set the admin authority
        admin.authority = ctx.accounts.authority.key();
        admin.mint = ctx.accounts.mint.key();
        admin.bump = ctx.bumps.admin;
        
        // Set the mint authority
        let mint_authority = &mut ctx.accounts.mint_authority;
        mint_authority.authority = ctx.accounts.authority.key();
        mint_authority.bump = ctx.bumps.mint_authority;
        
        // Зберігаємо bump для пізнішого використання
        let bump = mint_authority.bump;

        // Mint initial tokens to the admin if initial supply is specified
        if initial_supply > 0 {
            // Here initial price is defined as $1 per token which equals 1 carat of amber
            let cpi_accounts = token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            };
            
            let mint_key = ctx.accounts.mint.key();
            let seeds = &[
                b"mint_authority".as_ref(),
                mint_key.as_ref(),
                &[bump],
            ];
            
            let signer = &[&seeds[..]];
            
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            );
            
            token::mint_to(cpi_ctx, initial_supply)?;
        }
        
        msg!("Amberium token initialized with initial supply: {}", initial_supply);
        Ok(())
    }

    // Mint new tokens based on newly mined amber
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        // Verify that the authority is the admin who can mint tokens
        require!(
            ctx.accounts.authority.key() == ctx.accounts.admin.authority,
            AmberiumError::Unauthorized
        );
        
        // Mint new tokens - each token represents 1 carat of amber
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        
        let mint_auth = &ctx.accounts.mint_authority;
        let mint_key = ctx.accounts.mint.key();
        
        let seeds = &[
            b"mint_authority".as_ref(),
            mint_key.as_ref(),
            &[mint_auth.bump],
        ];
        
        let signer = &[&seeds[..]];
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        
        token::mint_to(cpi_ctx, amount)?;
        
        msg!("Minted {} Amberium tokens backed by newly mined amber", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        seeds = [b"admin", mint.key().as_ref()],
        bump,
        space = 8 + AdminConfig::LEN
    )]
    pub admin: Account<'info, AdminConfig>,
    
    #[account(
        init,
        payer = authority,
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump,
        space = 8 + MintAuthority::LEN
    )]
    pub mint_authority: Account<'info, MintAuthority>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = authority,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"admin", mint.key().as_ref()],
        bump = admin.bump,
        constraint = admin.authority == authority.key() @ AmberiumError::Unauthorized,
    )]
    pub admin: Account<'info, AdminConfig>,
    
    #[account(
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump = mint_authority.bump,
    )]
    pub mint_authority: Account<'info, MintAuthority>,
    
    #[account(
        mut,
        constraint = mint.key() == admin.mint @ AmberiumError::InvalidMint,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = token_account.mint == mint.key() @ AmberiumError::InvalidTokenAccount,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(Default)]
pub struct AdminConfig {
    pub authority: Pubkey,   // The authorized admin address
    pub mint: Pubkey,        // Address of the Amberium token mint
    pub bump: u8,            // PDA bump seed
}

impl AdminConfig {
    pub const LEN: usize = 32 + 32 + 1; // authority + mint + bump
}

#[account]
#[derive(Default)]
pub struct MintAuthority {
    pub authority: Pubkey,   // The authority allowed to mint
    pub bump: u8,            // PDA bump seed
}

impl MintAuthority {
    pub const LEN: usize = 32 + 1; // authority + bump
}

#[error_code]
pub enum AmberiumError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("Invalid mint account")]
    InvalidMint,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
}
