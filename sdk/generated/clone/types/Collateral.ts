/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { RawDecimal, rawDecimalBeet } from './RawDecimal'
export type Collateral = {
  oracleInfoIndex: beet.bignum
  mint: web3.PublicKey
  vault: web3.PublicKey
  vaultOnusdSupply: RawDecimal
  vaultMintSupply: RawDecimal
  vaultCometSupply: RawDecimal
  stable: beet.bignum
  collateralizationRatio: RawDecimal
  liquidationDiscount: RawDecimal
}

/**
 * @category userTypes
 * @category generated
 */
export const collateralBeet = new beet.BeetArgsStruct<Collateral>(
  [
    ['oracleInfoIndex', beet.u64],
    ['mint', beetSolana.publicKey],
    ['vault', beetSolana.publicKey],
    ['vaultOnusdSupply', rawDecimalBeet],
    ['vaultMintSupply', rawDecimalBeet],
    ['vaultCometSupply', rawDecimalBeet],
    ['stable', beet.u64],
    ['collateralizationRatio', rawDecimalBeet],
    ['liquidationDiscount', rawDecimalBeet],
  ],
  'Collateral'
)
