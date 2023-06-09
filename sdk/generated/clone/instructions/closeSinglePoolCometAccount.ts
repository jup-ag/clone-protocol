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
 * @category CloseSinglePoolCometAccount
 * @category generated
 */
export const closeSinglePoolCometAccountStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'CloseSinglePoolCometAccountInstructionArgs'
)
/**
 * Accounts required by the _closeSinglePoolCometAccount_ instruction
 *
 * @property [**signer**] user
 * @property [_writable_] userAccount
 * @property [_writable_] singlePoolComet
 * @property [_writable_] destination
 * @category Instructions
 * @category CloseSinglePoolCometAccount
 * @category generated
 */
export type CloseSinglePoolCometAccountInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  singlePoolComet: web3.PublicKey
  destination: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const closeSinglePoolCometAccountInstructionDiscriminator = [
  159, 199, 224, 106, 179, 115, 188, 64,
]

/**
 * Creates a _CloseSinglePoolCometAccount_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category CloseSinglePoolCometAccount
 * @category generated
 */
export function createCloseSinglePoolCometAccountInstruction(
  accounts: CloseSinglePoolCometAccountInstructionAccounts,
  programId = new web3.PublicKey('6xmjJPzcUQHb7Dhii4EfqvP8UxanxWYwRSpVY4yAUa2g')
) {
  const [data] = closeSinglePoolCometAccountStruct.serialize({
    instructionDiscriminator:
      closeSinglePoolCometAccountInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.user,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.userAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.singlePoolComet,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.destination,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.systemProgram ?? web3.SystemProgram.programId,
      isWritable: false,
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
