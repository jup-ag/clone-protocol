use crate::error::*;
use crate::math::*;
use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, *};
use rust_decimal::prelude::*;
use std::convert::TryInto;

#[derive(Accounts)]
#[instruction(user_nonce: u8, comet_collateral_index: u8)]
pub struct SwapStableCollateralIntoUsdi<'info> {
    pub liquidator: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager.bump,
        has_one = token_data
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    pub user: AccountInfo<'info>,
    #[account(
        seeds = [b"user".as_ref(), user.key.as_ref()],
        bump = user_nonce,
        has_one = comet,
    )]
    pub user_account: Box<Account<'info, User>>,
    #[account(
        mut,
        constraint = comet.load()?.is_single_pool == 0,
        constraint = comet.load()?.owner == user_account.authority @ InceptError::InvalidAccountLoaderOwner,
        constraint = comet.load()?.num_collaterals > comet_collateral_index.into() @ InceptError::InvalidInputPositionIndex
    )]
    pub comet: AccountLoader<'info, Comet>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        address = token_data.load()?.collaterals[comet.load()?.collaterals[comet_collateral_index as usize].collateral_index as usize].vault,
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.collaterals[USDI_COLLATERAL_INDEX].vault,
   )]
    pub usdi_vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

pub fn execute(
    ctx: Context<SwapStableCollateralIntoUsdi>,
    _user_nonce: u8,
    comet_collateral_index: u8,
) -> Result<()> {
    let manager_nonce = ctx.accounts.manager.bump;
    let seeds = &[&[b"manager", bytemuck::bytes_of(&manager_nonce)][..]];

    let mut token_data = ctx.accounts.token_data.load_mut()?;
    let mut comet = ctx.accounts.comet.load_mut()?;
    let comet_collateral = comet.collaterals[comet_collateral_index as usize];
    let collateral = token_data.collaterals[comet_collateral.collateral_index as usize];

    require!(
        comet_collateral.collateral_index as usize != USDI_COLLATERAL_INDEX
            && collateral.stable == 1,
        InceptError::InvalidCollateralType
    );

    // Require a healthy score after transactions
    let health_score = calculate_health_score(&comet, &token_data, None)?;

    require!(
        !health_score.is_healthy(),
        InceptError::NotSubjectToLiquidation
    );

    let mut collateral_to_convert = comet_collateral.collateral_amount.to_decimal();
    // Update collaterals. // Need to check the rescaling.
    comet.collaterals[comet_collateral_index as usize].collateral_amount =
        RawDecimal::from(Decimal::new(0, collateral_to_convert.scale()));
    token_data.collaterals[comet_collateral.collateral_index as usize].vault_comet_supply =
        RawDecimal::from(
            token_data.collaterals[comet_collateral.collateral_index as usize]
                .vault_comet_supply
                .to_decimal()
                - collateral_to_convert,
        );
    token_data.collaterals[comet_collateral.collateral_index as usize].vault_usdi_supply =
        RawDecimal::from(
            token_data.collaterals[comet_collateral.collateral_index as usize]
                .vault_usdi_supply
                .to_decimal()
                + collateral_to_convert,
        );

    collateral_to_convert.rescale(DEVNET_TOKEN_SCALE);
    // USDi is at 0 index
    comet.collaterals[0usize].collateral_amount = RawDecimal::from(
        comet.collaterals[0usize].collateral_amount.to_decimal() + collateral_to_convert,
    );
    token_data.collaterals[USDI_COLLATERAL_INDEX].vault_comet_supply = RawDecimal::from(
        token_data.collaterals[USDI_COLLATERAL_INDEX]
            .vault_comet_supply
            .to_decimal()
            + collateral_to_convert,
    );

    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().clone(),
            MintTo {
                mint: ctx.accounts.usdi_mint.to_account_info().clone(),
                to: ctx.accounts.usdi_vault.to_account_info().clone(),
                authority: ctx.accounts.manager.to_account_info().clone(),
            },
            seeds,
        ),
        collateral_to_convert.mantissa().try_into().unwrap(),
    )?;

    Ok(())
}
