/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import { BorrowPosition, borrowPositionBeet } from './BorrowPosition'
export type BorrowPositions = {
  numPositions: beet.bignum
  positions: BorrowPosition[] /* size: 24 */
}

/**
 * @category userTypes
 * @category generated
 */
export const borrowPositionsBeet = new beet.BeetArgsStruct<BorrowPositions>(
  [
    ['numPositions', beet.u64],
    ['positions', beet.uniformFixedSizeArray(borrowPositionBeet, 24)],
  ],
  'BorrowPositions'
)
