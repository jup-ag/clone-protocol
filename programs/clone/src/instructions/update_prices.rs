use crate::error::*;
use crate::return_error_if_false;
use crate::states::*;
use crate::ORACLES_SEED;
use anchor_lang::prelude::*;
use pyth_sdk_solana::Price;
use std::convert::TryInto;
use switchboard_solana::AggregatorAccountData;

pub const MAX_SIZE: usize = 128;

#[cfg(feature = "pyth-local")]
fn load_price_from_pyth(pyth_oracle: &AccountInfo) -> Result<Price> {
    use pyth::pc::Price as LocalPrice;
    if let Ok(price_feed) = LocalPrice::load(pyth_oracle) {
        Ok(Price {
            price: price_feed.agg.price,
            expo: price_feed.expo,
            conf: price_feed.agg.conf,
            publish_time: price_feed.valid_slot.try_into().unwrap(),
        })
    } else {
        Err(error!(CloneError::FailedToLoadPyth))
    }
}

#[cfg(not(feature = "pyth-local"))]
fn load_price_from_pyth(pyth_oracle: &AccountInfo) -> Result<Price> {
    use pyth_sdk_solana::load_price_feed_from_account_info;
    if let Ok(price_feed) = load_price_feed_from_account_info(pyth_oracle) {
        // TODO: Switch over to `get_price_no_older_than` method.
        Ok(price_feed.get_price_unchecked())
    } else {
        Err(error!(CloneError::FailedToLoadPyth))
    }
}
#[derive(Accounts)]
#[instruction(oracle_indices: Vec<u8>)]
pub struct UpdatePrices<'info> {
    #[account(
        mut,
        seeds = [ORACLES_SEED.as_ref()],
        bump,
    )]
    pub oracles: Box<Account<'info, Oracles>>,
}

pub fn execute<'info>(
    ctx: Context<'_, '_, '_, 'info, UpdatePrices<'info>>,
    oracle_indices: Vec<u8>,
) -> Result<()> {
    let oracles = &mut ctx.accounts.oracles.oracles;

    // generate data from pyth oracle
    for (account_index, oracle_index) in oracle_indices.iter().enumerate() {
        let supplied_oracle_address = &ctx.remaining_accounts[account_index];
        let oracle_index = *oracle_index as usize;
        let oracle: &mut OracleInfo = &mut oracles[oracle_index];

        return_error_if_false!(
            supplied_oracle_address.key().eq(&oracle.address),
            CloneError::IncorrectOracleAddress
        );

        let (price, expo) = match oracle.source {
            OracleSource::PYTH => {
                let info = load_price_from_pyth(supplied_oracle_address)?;
                if info.expo <= 0 {
                    (info.price, (-info.expo).try_into().unwrap())
                } else {
                    (info.price * 10_i64.pow(info.expo.try_into().unwrap()), 0)
                }
            }
            OracleSource::SWITCHBOARD => {
                let raw = supplied_oracle_address.try_borrow_data()?;
                let data_feed = AggregatorAccountData::new_from_bytes(*raw)?;
                let result = data_feed.get_result()?;
                (
                    result.mantissa.try_into().unwrap(),
                    result.scale.try_into().unwrap(),
                )
            }
        };

        oracles[oracle_index].price = price;
        oracles[oracle_index].expo = expo;
        oracles[oracle_index].last_update_slot = Clock::get()?.slot;
    }

    Ok(())
}
