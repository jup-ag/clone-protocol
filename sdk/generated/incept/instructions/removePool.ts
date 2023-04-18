/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category RemovePool
 * @category generated
 */
export type RemovePoolInstructionArgs = {
  poolIndex: number
  forceRemoval: boolean
}
/**
 * @category Instructions
 * @category RemovePool
 * @category generated
 */
export const removePoolStruct = new beet.BeetArgsStruct<
  RemovePoolInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['poolIndex', beet.u8],
    ['forceRemoval', beet.bool],
  ],
  'RemovePoolInstructionArgs'
)
/**
 * Accounts required by the _removePool_ instruction
 *
 * @property [**signer**] admin
 * @property [] incept
 * @property [_writable_] tokenData
 * @category Instructions
 * @category RemovePool
 * @category generated
 */
export type RemovePoolInstructionAccounts = {
  admin: web3.PublicKey
  incept: web3.PublicKey
  tokenData: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const removePoolInstructionDiscriminator = [
  132, 42, 53, 138, 28, 220, 170, 55,
]

/**
 * Creates a _RemovePool_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category RemovePool
 * @category generated
 */
export function createRemovePoolInstruction(
  accounts: RemovePoolInstructionAccounts,
  args: RemovePoolInstructionArgs,
  programId = new web3.PublicKey('5k28XzdwaWVXaWBwfm4ZFXQAnBaTfzu25k1sHatsnsL1')
) {
  const [data] = removePoolStruct.serialize({
    instructionDiscriminator: removePoolInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.admin,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.incept,
      isWritable: false,
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
