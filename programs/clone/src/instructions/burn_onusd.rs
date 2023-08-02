use crate::decimal::{rescale_toward_zero, CLONE_TOKEN_SCALE};
use crate::states::*;
use crate::{to_clone_decimal, CLONE_PROGRAM_SEED};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};
use rust_decimal::prelude::*;
use std::convert::TryInto;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct BurnONUSD<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [CLONE_PROGRAM_SEED.as_ref()],
        bump = clone.bump,
        has_one = onusd_mint,
        has_one = token_data
    )]
    pub clone: Box<Account<'info, Clone>>,
    #[account(
        mut,
        has_one = clone
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = token_data.load()?.collaterals[USDC_COLLATERAL_INDEX].vault
    )]
    pub usdc_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = clone.onusd_mint
    )]
    pub onusd_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = onusd_mint,
        associated_token::authority = user
    )]
    pub user_onusd_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_vault.mint,
        associated_token::authority = user
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn execute(ctx: Context<BurnONUSD>, amount: u64) -> Result<()> {
    let seeds = &[&[
        CLONE_PROGRAM_SEED.as_ref(),
        bytemuck::bytes_of(&ctx.accounts.clone.bump),
    ][..]];
    let token_data = &mut ctx.accounts.token_data.load_mut()?;
    let collateral = token_data.collaterals[USDC_COLLATERAL_INDEX];

    let collateral_scale = collateral.scale;

    let user_onusd_amount = to_clone_decimal!(ctx.accounts.user_onusd_token_account.amount);
    let onusd_value =
        Decimal::new(amount.try_into().unwrap(), CLONE_TOKEN_SCALE).min(user_onusd_amount);
    let collateral_value = rescale_toward_zero(onusd_value, collateral_scale.try_into().unwrap());

    // transfer collateral from vault to user
    let cpi_accounts = Transfer {
        from: ctx.accounts.usdc_vault.to_account_info().clone(),
        to: ctx
            .accounts
            .user_collateral_token_account
            .to_account_info()
            .clone(),
        authority: ctx.accounts.clone.to_account_info().clone(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, seeds),
        collateral_value.mantissa().try_into().unwrap(),
    )?;

    // Burn ONUSD
    let cpi_accounts = Burn {
        mint: ctx.accounts.onusd_mint.to_account_info().clone(),
        from: ctx
            .accounts
            .user_onusd_token_account
            .to_account_info()
            .clone(),
        authority: ctx.accounts.user.to_account_info().clone(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::burn(CpiContext::new(cpi_program, cpi_accounts), amount)?;

    Ok(())
}
