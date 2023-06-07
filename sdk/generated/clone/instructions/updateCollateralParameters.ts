/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import {
  CollateralParameters,
  collateralParametersBeet,
} from '../types/CollateralParameters'

/**
 * @category Instructions
 * @category UpdateCollateralParameters
 * @category generated
 */
export type UpdateCollateralParametersInstructionArgs = {
  index: number
  params: CollateralParameters
}
/**
 * @category Instructions
 * @category UpdateCollateralParameters
 * @category generated
 */
export const updateCollateralParametersStruct = new beet.FixableBeetArgsStruct<
  UpdateCollateralParametersInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['index', beet.u8],
    ['params', collateralParametersBeet],
  ],
  'UpdateCollateralParametersInstructionArgs'
)
/**
 * Accounts required by the _updateCollateralParameters_ instruction
 *
 * @property [**signer**] admin
 * @property [_writable_] clone
 * @property [_writable_] tokenData
 * @category Instructions
 * @category UpdateCollateralParameters
 * @category generated
 */
export type UpdateCollateralParametersInstructionAccounts = {
  admin: web3.PublicKey
  clone: web3.PublicKey
  tokenData: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const updateCollateralParametersInstructionDiscriminator = [
  148, 150, 191, 61, 91, 124, 119, 69,
]

/**
 * Creates a _UpdateCollateralParameters_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category UpdateCollateralParameters
 * @category generated
 */
export function createUpdateCollateralParametersInstruction(
  accounts: UpdateCollateralParametersInstructionAccounts,
  args: UpdateCollateralParametersInstructionArgs,
  programId = new web3.PublicKey('6xmjJPzcUQHb7Dhii4EfqvP8UxanxWYwRSpVY4yAUa2g')
) {
  const [data] = updateCollateralParametersStruct.serialize({
    instructionDiscriminator:
      updateCollateralParametersInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.admin,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.clone,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenData,
      isWritable: true,
      isSigner: false,
    },
  ]

  if (accounts.anchorRemainingAccounts != null) {
    for (const acc of accounts.anchorRemainingAccounts) {
      keys.push(acc)
    }
  }

  const ix = new web3.TransactionInstruction({
    programId,
    keys,
    data,
  })
  return ix
}
