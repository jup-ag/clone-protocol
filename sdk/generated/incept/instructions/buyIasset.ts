/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category BuyIasset
 * @category generated
 */
export type BuyIassetInstructionArgs = {
  poolIndex: number
  amount: beet.bignum
  usdiSpendThreshold: beet.bignum
}
/**
 * @category Instructions
 * @category BuyIasset
 * @category generated
 */
export const buyIassetStruct = new beet.BeetArgsStruct<
  BuyIassetInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['poolIndex', beet.u8],
    ['amount', beet.u64],
    ['usdiSpendThreshold', beet.u64],
  ],
  'BuyIassetInstructionArgs'
)
/**
 * Accounts required by the _buyIasset_ instruction
 *
 * @property [**signer**] user
 * @property [_writable_] incept
 * @property [_writable_] tokenData
 * @property [_writable_] userUsdiTokenAccount
 * @property [_writable_] userIassetTokenAccount
 * @property [_writable_] ammUsdiTokenAccount
 * @property [_writable_] ammIassetTokenAccount
 * @property [_writable_] treasuryIassetTokenAccount
 * @category Instructions
 * @category BuyIasset
 * @category generated
 */
export type BuyIassetInstructionAccounts = {
  user: web3.PublicKey
  incept: web3.PublicKey
  tokenData: web3.PublicKey
  userUsdiTokenAccount: web3.PublicKey
  userIassetTokenAccount: web3.PublicKey
  ammUsdiTokenAccount: web3.PublicKey
  ammIassetTokenAccount: web3.PublicKey
  treasuryIassetTokenAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const buyIassetInstructionDiscriminator = [
  181, 188, 7, 223, 42, 105, 245, 188,
]

/**
 * Creates a _BuyIasset_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category BuyIasset
 * @category generated
 */
export function createBuyIassetInstruction(
  accounts: BuyIassetInstructionAccounts,
  args: BuyIassetInstructionArgs,
  programId = new web3.PublicKey('5k28XzdwaWVXaWBwfm4ZFXQAnBaTfzu25k1sHatsnsL1')
) {
  const [data] = buyIassetStruct.serialize({
    instructionDiscriminator: buyIassetInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.user,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.incept,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenData,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.userUsdiTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.userIassetTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.ammUsdiTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.ammIassetTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.treasuryIassetTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
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
