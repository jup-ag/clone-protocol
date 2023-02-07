use crate::error::*;
//use crate::instructions::MintUSDI;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};
use rust_decimal::prelude::*;
use std::convert::TryInto;

#[derive(Accounts)]
#[instruction( amount: u64)]
pub struct MintUSDI<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager.bump,
        has_one = usdi_mint,
        has_one = token_data
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = usdi_mint,
        associated_token::authority = user
    )]
    pub user_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = vault.mint,
        associated_token::authority = user
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn execute(ctx: Context<MintUSDI>, amount: u64) -> Result<()> {
    let seeds = &[&[b"manager", bytemuck::bytes_of(&ctx.accounts.manager.bump)][..]];
    let token_data = &mut ctx.accounts.token_data.load_mut()?;

    let (collateral, collateral_index) =
        TokenData::get_collateral_tuple(token_data, *ctx.accounts.vault.to_account_info().key)
            .unwrap();
    let collateral_scale = collateral.vault_mint_supply.to_decimal().scale();

    let mut usdi_value = Decimal::new(amount.try_into().unwrap(), DEVNET_TOKEN_SCALE);

    let collateral_value = Decimal::from_str(
        &ctx.accounts
            .user_collateral_token_account
            .amount
            .to_string(),
    )
    .unwrap()
        / Decimal::new(1, collateral_scale);

    // check to see if the collateral used to mint usdi is stable
    let is_stable: Result<bool> = match collateral.stable {
        0 => Ok(false),
        1 => Ok(true),
        _ => Err(error!(InceptError::InvalidBool)),
    };

    // if collateral is not stable, we throw an error
    if !(is_stable.unwrap()) {
        return Err(InceptError::InvalidCollateralType.into());
    }

    // check if their is sufficient collateral to mint
    if usdi_value > collateral_value {
        return Err(InceptError::InsufficientCollateral.into());
    }

    // add collateral amount to vault supply
    let current_vault_usdi_supply = collateral.vault_usdi_supply.to_decimal();
    let mut new_vault_usdi_supply = current_vault_usdi_supply + collateral_value;
    new_vault_usdi_supply.rescale(current_vault_usdi_supply.scale());
    token_data.collaterals[collateral_index].vault_usdi_supply =
        RawDecimal::from(new_vault_usdi_supply);

    // transfer user collateral to vault
    usdi_value.rescale(current_vault_usdi_supply.scale());
    let cpi_accounts = Transfer {
        from: ctx
            .accounts
            .user_collateral_token_account
            .to_account_info()
            .clone(),
        to: ctx.accounts.vault.to_account_info().clone(),
        authority: ctx.accounts.user.to_account_info().clone(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, seeds),
        usdi_value.mantissa().try_into().unwrap(),
    )?;

    // mint usdi to user
    let cpi_accounts = MintTo {
        mint: ctx.accounts.usdi_mint.to_account_info().clone(),
        to: ctx
            .accounts
            .user_usdi_token_account
            .to_account_info()
            .clone(),
        authority: ctx.accounts.manager.to_account_info().clone(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::mint_to(
        CpiContext::new_with_signer(cpi_program, cpi_accounts, seeds),
        amount,
    )?;

    Ok(())
}
