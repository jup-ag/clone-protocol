use crate::states::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum CloneParameters {
    LiquidationFee { value: RawDecimal },
    MaxHealthLiquidation { value: RawDecimal },
    TreasuryAddress { address: Pubkey },
}

#[derive(Accounts)]
#[instruction(
    params: CloneParameters
)]
pub struct UpdateCloneParameters<'info> {
    #[account(address = clone.admin)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"clone".as_ref()],
        bump = clone.bump,
    )]
    pub clone: Box<Account<'info, Clone>>,
}

pub fn execute(ctx: Context<UpdateCloneParameters>, params: CloneParameters) -> Result<()> {
    match params {
        CloneParameters::LiquidationFee { value } => {
            ctx.accounts.clone.liquidation_config.liquidator_fee = value;
        }
        CloneParameters::MaxHealthLiquidation { value } => {
            ctx.accounts.clone.liquidation_config.max_health_liquidation = value;
        }
        CloneParameters::TreasuryAddress { address } => {
            ctx.accounts.clone.treasury_address = address;
        }
    }

    Ok(())
}
