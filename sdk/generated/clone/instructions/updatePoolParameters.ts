/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import { PoolParameters, poolParametersBeet } from '../types/PoolParameters'

/**
 * @category Instructions
 * @category UpdatePoolParameters
 * @category generated
 */
export type UpdatePoolParametersInstructionArgs = {
  index: number
  params: PoolParameters
}
/**
 * @category Instructions
 * @category UpdatePoolParameters
 * @category generated
 */
export const updatePoolParametersStruct = new beet.FixableBeetArgsStruct<
  UpdatePoolParametersInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['index', beet.u8],
    ['params', poolParametersBeet],
  ],
  'UpdatePoolParametersInstructionArgs'
)
/**
 * Accounts required by the _updatePoolParameters_ instruction
 *
 * @property [**signer**] admin
 * @property [_writable_] clone
 * @property [_writable_] tokenData
 * @category Instructions
 * @category UpdatePoolParameters
 * @category generated
 */
export type UpdatePoolParametersInstructionAccounts = {
  admin: web3.PublicKey
  clone: web3.PublicKey
  tokenData: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const updatePoolParametersInstructionDiscriminator = [
  141, 98, 249, 196, 230, 84, 52, 127,
]

/**
 * Creates a _UpdatePoolParameters_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category UpdatePoolParameters
 * @category generated
 */
export function createUpdatePoolParametersInstruction(
  accounts: UpdatePoolParametersInstructionAccounts,
  args: UpdatePoolParametersInstructionArgs,
  programId = new web3.PublicKey('BxUeKSA62ME4uZZH5gJ3p3co47D8RiZzdLwZSyNgs4sJ')
) {
  const [data] = updatePoolParametersStruct.serialize({
    instructionDiscriminator: updatePoolParametersInstructionDiscriminator,
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
