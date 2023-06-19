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
 * @category CloseCometAccount
 * @category generated
 */
export const closeCometAccountStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'CloseCometAccountInstructionArgs'
)
/**
 * Accounts required by the _closeCometAccount_ instruction
 *
 * @property [**signer**] user
 * @property [_writable_] userAccount
 * @property [_writable_] comet
 * @property [_writable_] destination
 * @category Instructions
 * @category CloseCometAccount
 * @category generated
 */
export type CloseCometAccountInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  comet: web3.PublicKey
  destination: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const closeCometAccountInstructionDiscriminator = [
  92, 179, 77, 158, 6, 14, 240, 143,
]

/**
 * Creates a _CloseCometAccount_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category CloseCometAccount
 * @category generated
 */
export function createCloseCometAccountInstruction(
  accounts: CloseCometAccountInstructionAccounts,
  programId = new web3.PublicKey('BxUeKSA62ME4uZZH5gJ3p3co47D8RiZzdLwZSyNgs4sJ')
) {
  const [data] = closeCometAccountStruct.serialize({
    instructionDiscriminator: closeCometAccountInstructionDiscriminator,
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
      pubkey: accounts.comet,
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
