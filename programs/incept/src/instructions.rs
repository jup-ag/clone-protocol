use crate::states::{
    CometPositions, LiquidityPositions, Manager, MintPositions, MultiPoolComet, TokenData, User,
};
use anchor_lang::prelude::*;
use anchor_spl::token::*;

#[derive(Accounts)]
#[instruction(manager_nonce: u8, il_health_score_coefficient: u64)]
pub struct InitializeManager<'info> {
    pub admin: Signer<'info>,
    #[account(
        init,
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        payer = admin
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        init,
        mint::decimals = 8,
        mint::authority = manager,
        payer = admin
    )]
    pub usdi_mint: Account<'info, Mint>,
    #[account(
        init,
        token::mint = usdi_mint,
        token::authority = manager,
        payer = admin
    )]
    pub liquidated_comet_usdi_token_account: Account<'info, TokenAccount>,
    #[account(zero)]
    pub token_data: AccountLoader<'info, TokenData>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub chainlink_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, il_health_score_coefficient: u64)]
pub struct UpdateILHealthScoreCoefficient<'info> {
    #[account(address = manager.admin)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Account<'info, Manager>,
    pub token_data: AccountLoader<'info, TokenData>,
}

#[derive(Accounts)]
#[instruction(user_nonce: u8)]
pub struct InitializeUser<'info> {
    pub user: Signer<'info>,
    #[account(
        init,
        seeds = [b"user".as_ref(), user.key.as_ref()],
        bump = user_nonce,
        payer = user
    )]
    pub user_account: Account<'info, User>,
    #[account(zero)]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(zero)]
    pub mint_positions: AccountLoader<'info, MintPositions>,
    #[account(zero)]
    pub liquidity_positions: AccountLoader<'info, LiquidityPositions>,
    #[account(zero)]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    pub usdi_mint: Account<'info, Mint>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, scale: u8, stable: u8)]
pub struct AddCollateral<'info> {
    #[account(address = manager.admin)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
        has_one = admin
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    pub collateral_mint: Account<'info, Mint>,
    #[account(
        init,
        token::mint = collateral_mint,
        token::authority = manager,
        payer = admin
    )]
    pub vault: Account<'info, TokenAccount>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, stable_collateral_ratio: u16, crypto_collateral_ratio: u16, health_score_coefficient: u64)]
pub struct InitializePool<'info> {
    #[account(address = manager.admin)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
        has_one = admin
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        token::mint = usdi_mint,
        token::authority = manager,
        payer = admin
    )]
    pub usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        mint::decimals = 8,
        mint::authority = manager,
        payer = admin
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        token::mint = iasset_mint,
        token::authority = manager,
        payer = admin
    )]
    pub iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        token::mint = iasset_mint,
        token::authority = manager,
        payer = admin
    )]
    pub liquidation_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        mint::decimals = 8,
        mint::authority = manager,
        payer = admin
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        token::mint = liquidity_token_mint,
        token::authority = manager,
        payer = admin
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    pub pyth_oracle: AccountInfo<'info>,
    pub chainlink_oracle: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, pool_index: u8, health_score_coefficient: u64)]
pub struct UpdatePoolHealthScore<'info> {
    #[account(address = manager.admin)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8)]
pub struct UpdatePrices<'info> {
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        address = token_data.load()?.chainlink_program
    )]
    pub chainlink_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, amount: u64)]
pub struct MintUSDI<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
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
        constraint = &user_usdi_token_account.mint == usdi_mint.to_account_info().key
    )]
    pub user_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_collateral_token_account.mint == vault.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&MintUSDI<'info>> for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
    fn from(accounts: &MintUSDI<'info>) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            to: accounts.vault.to_account_info().clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
impl<'a, 'b, 'c, 'info> From<&MintUSDI<'info>> for CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
    fn from(accounts: &MintUSDI<'info>) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: accounts.usdi_mint.to_account_info().clone(),
            to: accounts.user_usdi_token_account.to_account_info().clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
#[derive(Accounts)]
#[instruction(manager_nonce: u8, iasset_amount: u64, collateral_amount: u64)]
pub struct InitializeMintPosition<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &mint_positions.load()?.owner == user.to_account_info().key
    )]
    pub mint_positions: AccountLoader<'info, MintPositions>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_collateral_token_account.amount >= collateral_amount,
        constraint = vault.mint == user_collateral_token_account.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    pub oracle: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&InitializeMintPosition<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &InitializeMintPosition<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            to: accounts.vault.to_account_info().clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}
impl<'a, 'b, 'c, 'info> From<&InitializeMintPosition<'info>>
    for CpiContext<'a, 'b, 'c, 'info, MintTo<'info>>
{
    fn from(
        accounts: &InitializeMintPosition<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: accounts.iasset_mint.to_account_info().clone(),
            to: accounts.user_iasset_token_account.to_account_info().clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, mint_index: u8, amount: u64)]
pub struct AddCollateralToMint<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &mint_positions.load()?.owner == user.to_account_info().key,
        constraint = (mint_index as u64) < mint_positions.load()?.num_positions
    )]
    pub mint_positions: AccountLoader<'info, MintPositions>,
    #[account(
        mut,
        address = token_data.load()?.collaterals[mint_positions.load()?.mint_positions[mint_index as usize].collateral_index as usize].vault
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_collateral_token_account.amount >= amount,
        constraint = vault.mint == user_collateral_token_account.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&AddCollateralToMint<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &AddCollateralToMint<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            to: accounts.vault.to_account_info().clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, mint_index: u8, amount: u64)]
pub struct WithdrawCollateralFromMint<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &mint_positions.load()?.owner == user.to_account_info().key,
        constraint = (mint_index as u64) < mint_positions.load()?.num_positions
    )]
    pub mint_positions: AccountLoader<'info, MintPositions>,
    #[account(
        mut,
        address = token_data.load()?.collaterals[mint_positions.load()?.mint_positions[mint_index as usize].collateral_index as usize].vault,
        constraint = vault.amount >= amount
    )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = vault.mint == user_collateral_token_account.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&WithdrawCollateralFromMint<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &WithdrawCollateralFromMint<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts.vault.to_account_info().clone(),
            to: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, mint_index: u8, amount: u64)]
pub struct PayBackiAssetToMint<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key,
        constraint = user_iasset_token_account.amount >= amount
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = &mint_positions.load()?.owner == user.to_account_info().key,
        constraint = (mint_index as u64) < mint_positions.load()?.num_positions,
        constraint = mint_positions.load()?.mint_positions[mint_index as usize].borrowed_iasset.to_u64() >= amount
    )]
    pub mint_positions: AccountLoader<'info, MintPositions>,
    #[account(
        mut,
        address = token_data.load()?.pools[mint_positions.load()?.mint_positions[mint_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&PayBackiAssetToMint<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Burn<'info>>
{
    fn from(accounts: &PayBackiAssetToMint<'info>) -> CpiContext<'a, 'b, 'c, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: accounts.iasset_mint.to_account_info().clone(),
            to: accounts.user_iasset_token_account.to_account_info().clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, mint_index: u8, amount: u64)]
pub struct AddiAssetToMint<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key,
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = &mint_positions.load()?.owner == user.to_account_info().key,
        constraint = (mint_index as u64) < mint_positions.load()?.num_positions
    )]
    pub mint_positions: AccountLoader<'info, MintPositions>,
    #[account(
        mut,
        address = token_data.load()?.pools[mint_positions.load()?.mint_positions[mint_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&AddiAssetToMint<'info>>
    for CpiContext<'a, 'b, 'c, 'info, MintTo<'info>>
{
    fn from(accounts: &AddiAssetToMint<'info>) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: accounts.iasset_mint.to_account_info().clone(),
            to: accounts.user_iasset_token_account.to_account_info().clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, pool_index: u8, iasset_amount: u64)]
pub struct InitializeLiquidityPosition<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager,
        constraint = (pool_index as u64) < token_data.load()?.num_pools
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &liquidity_positions.load()?.owner == user.to_account_info().key
    )]
    pub liquidity_positions: AccountLoader<'info, LiquidityPositions>,
    #[account(
        mut,
        constraint = user_usdi_token_account.mint == manager.usdi_mint
    )]
    pub user_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_iasset_token_account.amount >= iasset_amount,
        constraint = user_iasset_token_account.mint == token_data.load()?.pools[pool_index as usize].asset_info.iasset_mint
    )]
    pub user_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &user_liquidity_token_account.mint == liquidity_token_mint.to_account_info().key
    )]
    pub user_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.pools[pool_index as usize].usdi_token_account
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.pools[pool_index as usize].iasset_token_account
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.pools[pool_index as usize].liquidity_token_mint
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&InitializeLiquidityPosition<'info>>
    for CpiContext<'a, 'b, 'c, 'info, MintTo<'info>>
{
    fn from(
        accounts: &InitializeLiquidityPosition<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: accounts.liquidity_token_mint.to_account_info().clone(),
            to: accounts
                .user_liquidity_token_account
                .to_account_info()
                .clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, liquidity_position_index: u8, iasset_amount: u64)]
pub struct ProvideLiquidity<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager,
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &liquidity_positions.load()?.owner == user.to_account_info().key
    )]
    pub liquidity_positions: AccountLoader<'info, LiquidityPositions>,
    #[account(
        mut,
        constraint = user_usdi_token_account.mint == manager.usdi_mint
    )]
    pub user_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_iasset_token_account.amount >= iasset_amount,
        constraint = user_iasset_token_account.mint == token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].asset_info.iasset_mint
    )]
    pub user_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &user_liquidity_token_account.mint == liquidity_token_mint.to_account_info().key
    )]
    pub user_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].usdi_token_account
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].iasset_token_account
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].liquidity_token_mint
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&ProvideLiquidity<'info>>
    for CpiContext<'a, 'b, 'c, 'info, MintTo<'info>>
{
    fn from(accounts: &ProvideLiquidity<'info>) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: accounts.liquidity_token_mint.to_account_info().clone(),
            to: accounts
                .user_liquidity_token_account
                .to_account_info()
                .clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, liquidity_position_index: u8, liquidity_token_amount: u64)]
pub struct WithdrawLiquidity<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager,
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &liquidity_positions.load()?.owner == user.to_account_info().key
    )]
    pub liquidity_positions: AccountLoader<'info, LiquidityPositions>,
    #[account(
        mut,
        constraint = user_usdi_token_account.mint == manager.usdi_mint
    )]
    pub user_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_iasset_token_account.mint == token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].asset_info.iasset_mint
    )]
    pub user_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_liquidity_token_account.amount >= liquidity_token_amount,
        constraint = &user_liquidity_token_account.mint == liquidity_token_mint.to_account_info().key
    )]
    pub user_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].usdi_token_account,
        constraint = amm_usdi_token_account.amount > 0
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].iasset_token_account,
        constraint = amm_iasset_token_account.amount > 0
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[liquidity_positions.load()?.liquidity_positions[liquidity_position_index as usize].pool_index as usize].liquidity_token_mint
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&WithdrawLiquidity<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Burn<'info>>
{
    fn from(accounts: &WithdrawLiquidity<'info>) -> CpiContext<'a, 'b, 'c, 'info, Burn<'info>> {
        let cpi_accounts = Burn {
            mint: accounts.liquidity_token_mint.to_account_info().clone(),
            to: accounts
                .user_liquidity_token_account
                .to_account_info()
                .clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, pool_index: u8, iasset_amount: u64)]
pub struct BuySynth<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager,
        constraint = (pool_index as u64) < token_data.load()?.num_pools
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = user_usdi_token_account.mint == manager.usdi_mint
    )]
    pub user_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_iasset_token_account.mint == token_data.load()?.pools[pool_index as usize].asset_info.iasset_mint
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, pool_index: u8, iasset_amount: u64)]
pub struct SellSynth<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager,
        constraint = (pool_index as u64) < token_data.load()?.num_pools
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = user_usdi_token_account.mint == manager.usdi_mint
    )]
    pub user_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_iasset_token_account.amount >= iasset_amount,
        constraint = user_iasset_token_account.mint == token_data.load()?.pools[pool_index as usize].asset_info.iasset_mint
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].iasset_token_account,
        constraint = amm_iasset_token_account.amount >= iasset_amount
    )]
    pub amm_iasset_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, pool_index: u8, collateral_amount: u64, usdi_amount: u64)]
pub struct InitializeComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = vault.mint == user_collateral_token_account.mint
    )]
    pub user_collateral_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = comet_liquidity_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
impl<'a, 'b, 'c, 'info> From<&InitializeComet<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(accounts: &InitializeComet<'info>) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            to: accounts.vault.to_account_info().clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_index: u8, collateral_amount: u64)]
pub struct AddCollateralToComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_collateral_token_account.amount >= collateral_amount,
        constraint = user_collateral_token_account.mint == vault.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&AddCollateralToComet<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &AddCollateralToComet<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            to: accounts.vault.to_account_info().clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_index: u8, collateral_amount: u64)]
pub struct WithdrawCollateralFromComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_collateral_token_account.amount >= collateral_amount,
        constraint = user_collateral_token_account.mint == vault.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&WithdrawCollateralFromComet<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &WithdrawCollateralFromComet<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts.vault.to_account_info().clone(),
            to: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_index: u8, usdi_amount: u64)]
pub struct AddLiquidityToComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = comet_liquidity_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_index: u8, usdi_amount: u64)]
pub struct WithdrawLiquidityFromComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = comet_liquidity_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_index: u8)]
pub struct CloseComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = user_collateral_token_account.mint == vault.mint
    )]
    pub user_collateral_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = &user_usdi_token_account.mint == usdi_mint.to_account_info().key
    )]
    pub user_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        address = token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_index: u8)]
pub struct RecenterComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, market_index: u8, comet_index: u8)]
pub struct LiquidateComet<'info> {
    pub liquidator: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
        constraint = liquidated_comet_usdi_token_account.to_account_info().key == &manager.liquidated_comet_usdi
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(has_one = comet_positions)]
    pub user_account: Box<Account<'info, User>>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        address = token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub liquidated_comet_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidation_iasset_token_account
    )]
    pub liquidation_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = manager.liquidated_comet_usdi
    )]
    pub liquidated_comet_usdi: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidator_collateral_token_account.mint == vault.mint
    )]
    pub liquidator_collateral_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &liquidator_usdi_token_account.mint == usdi_mint.to_account_info().key
    )]
    pub liquidator_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &liquidator_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub liquidator_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, user_nonce: u8, comet_index: u8)]
pub struct ClaimLiquidatedComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        seeds = [b"user".as_ref(), user.key.as_ref()],
        bump = user_nonce,
        has_one = comet_positions,
    )]
    pub user_account: Box<Account<'info, User>>,
    #[account(
        mut,
        constraint = &comet_positions.load()?.owner == user.to_account_info().key,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = user_iasset_token_account.mint == token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].asset_info.iasset_mint
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_usdi_token_account.mint == manager.usdi_mint
    )]
    pub user_usdi_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidation_iasset_token_account
    )]
    pub liquidation_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        address = manager.liquidated_comet_usdi
    )]
    pub liquidated_comet_usdi: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8)]
pub struct InitializeUserCometManagerPosition<'info> {
    pub user: Signer<'info>,
    #[account(address = manager.admin)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = admin
    )]
    pub manager: Account<'info, Manager>,
    #[account(mut)]
    pub user_account: Box<Account<'info, User>>,
    #[account(zero)]
    pub comet_manager: AccountLoader<'info, MultiPoolComet>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, pool_index: u8, usdi_amount: u64)]
pub struct InitializeMultiPoolCometPosition<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &multi_pool_comet.load()?.owner == user.to_account_info().key
    )]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = comet_liquidity_token_account.to_account_info().key == &token_data.load()?.pools[pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, collateral_index: u8, collateral_amount: u64)]
pub struct AddCollateralToMultiPoolComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &multi_pool_comet.load()?.owner == user.to_account_info().key,
    )]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_collateral_token_account.amount >= collateral_amount,
        constraint = user_collateral_token_account.mint == vault.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&AddCollateralToMultiPoolComet<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &AddCollateralToMultiPoolComet<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            to: accounts.vault.to_account_info().clone(),
            authority: accounts.user.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, collateral_index: u8, collateral_amount: u64)]
pub struct WithdrawCollateralFromMultiPoolComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &multi_pool_comet.load()?.owner == user.to_account_info().key,
    )]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[collateral_index as usize].mint,
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = user_collateral_token_account.mint == vault.mint
    )]
    pub user_collateral_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
impl<'a, 'b, 'c, 'info> From<&WithdrawCollateralFromMultiPoolComet<'info>>
    for CpiContext<'a, 'b, 'c, 'info, Transfer<'info>>
{
    fn from(
        accounts: &WithdrawCollateralFromMultiPoolComet<'info>,
    ) -> CpiContext<'a, 'b, 'c, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: accounts.vault.to_account_info().clone(),
            to: accounts
                .user_collateral_token_account
                .to_account_info()
                .clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_position_index: u8, usdi_amount: u64)]
pub struct AddLiquidityToMultiPoolComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &multi_pool_comet.load()?.owner == user.to_account_info().key,
    )]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = comet_liquidity_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_position_index: u8, usdi_amount: u64)]
pub struct WithdrawLiquidityFromMultiPoolComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        constraint = &multi_pool_comet.load()?.owner == user.to_account_info().key,
    )]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = comet_liquidity_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_position_index: u8, collateral_index: u8)]
pub struct RecenterMultiPoolComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = &multi_pool_comet.load()?.owner == user.to_account_info().key,
        constraint = (comet_position_index as u64) < multi_pool_comet.load()?.num_positions
    )]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_position_index: u8)]
pub struct CloseMultiPoolComet<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = &user_usdi_token_account.mint == usdi_mint.to_account_info().key
    )]
    pub user_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &multi_pool_comet.load()?.owner == user.to_account_info().key,
        constraint = (comet_position_index as u64) < multi_pool_comet.load()?.num_positions
    )]
    pub multi_pool_comet: AccountLoader<'info, MultiPoolComet>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        address = token_data.load()?.pools[multi_pool_comet.load()?.comet_positions[comet_position_index as usize].pool_index as usize].comet_liquidity_token_account,
    )]
    pub comet_liquidity_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, amount: u64)]
pub struct MintUSDIHackathon<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = usdi_mint,
        has_one = token_data
    )]
    pub manager: Account<'info, Manager>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = &user_usdi_token_account.mint == usdi_mint.to_account_info().key
    )]
    pub user_usdi_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

impl<'a, 'b, 'c, 'info> From<&MintUSDIHackathon<'info>>
    for CpiContext<'a, 'b, 'c, 'info, MintTo<'info>>
{
    fn from(accounts: &MintUSDIHackathon<'info>) -> CpiContext<'a, 'b, 'c, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: accounts.usdi_mint.to_account_info().clone(),
            to: accounts.user_usdi_token_account.to_account_info().clone(),
            authority: accounts.manager.to_account_info().clone(),
        };
        let cpi_program = accounts.token_program.to_account_info();
        CpiContext::new(cpi_program, cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, mint_index: u8)]
pub struct LiquidateMintPosition<'info> {
    pub liquidator: Signer<'info>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(has_one = mint_positions)]
    pub user_account: Box<Account<'info, User>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[mint_positions.load()?.mint_positions[mint_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        owner = *user_account.to_account_info().owner,
        constraint = (mint_index as u64) < mint_positions.load()?.num_positions
    )]
    pub mint_positions: AccountLoader<'info, MintPositions>,
    #[account(
        mut,
        address = token_data.load()?.collaterals[mint_positions.load()?.mint_positions[mint_index as usize].collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[mint_positions.load()?.mint_positions[mint_index as usize].collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[mint_positions.load()?.mint_positions[mint_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[mint_positions.load()?.mint_positions[mint_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidator_collateral_token_account.mint == vault.mint
   )]
    pub liquidator_collateral_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = &liquidator_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub liquidator_iasset_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(manager_nonce: u8, comet_index: u8)]
pub struct PartialCometLiquidation<'info> {
    pub liquidator: Signer<'info>,
    #[account(has_one = comet_positions)]
    pub user_account: Box<Account<'info, User>>,
    #[account(
        seeds = [b"manager".as_ref()],
        bump = manager_nonce,
        has_one = token_data,
    )]
    pub manager: Box<Account<'info, Manager>>,
    #[account(
        mut,
        has_one = manager
    )]
    pub token_data: AccountLoader<'info, TokenData>,
    #[account(
        mut,
        address = manager.usdi_mint
    )]
    pub usdi_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = iasset_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].asset_info.iasset_mint,
    )]
    pub iasset_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = &user_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub user_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = &liquidator_iasset_token_account.mint == iasset_mint.to_account_info().key
    )]
    pub liquidator_iasset_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        owner = *user_account.to_account_info().owner,
        constraint = (comet_index as u64) < comet_positions.load()?.num_positions
    )]
    pub comet_positions: AccountLoader<'info, CometPositions>,
    #[account(
        mut,
        constraint = amm_usdi_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].usdi_token_account,
    )]
    pub amm_usdi_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = amm_iasset_token_account.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].iasset_token_account,
    )]
    pub amm_iasset_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = liquidity_token_mint.to_account_info().key == &token_data.load()?.pools[comet_positions.load()?.comet_positions[comet_index as usize].pool_index as usize].liquidity_token_mint,
    )]
    pub liquidity_token_mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        constraint = vault.to_account_info().key == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].vault,
        constraint = &vault.mint == &token_data.load()?.collaterals[comet_positions.load()?.comet_positions[comet_index as usize].collateral_index as usize].mint
   )]
    pub vault: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
}
