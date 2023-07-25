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
 * @category InitializeBorrowPosition
 * @category generated
 */
export type InitializeBorrowPositionInstructionArgs = {
  poolIndex: number
  collateralIndex: number
  onassetAmount: beet.bignum
  collateralAmount: beet.bignum
}
/**
 * @category Instructions
 * @category InitializeBorrowPosition
 * @category generated
 */
export const initializeBorrowPositionStruct = new beet.BeetArgsStruct<
  InitializeBorrowPositionInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['poolIndex', beet.u8],
    ['collateralIndex', beet.u8],
    ['onassetAmount', beet.u64],
    ['collateralAmount', beet.u64],
  ],
  'InitializeBorrowPositionInstructionArgs'
)
/**
 * Accounts required by the _initializeBorrowPosition_ instruction
 *
 * @property [**signer**] user
 * @property [] userAccount
 * @property [] clone
 * @property [_writable_] tokenData
 * @property [_writable_] vault
 * @property [_writable_] userCollateralTokenAccount
 * @property [_writable_] onassetMint
 * @property [_writable_] userOnassetTokenAccount
 * @category Instructions
 * @category InitializeBorrowPosition
 * @category generated
 */
export type InitializeBorrowPositionInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  clone: web3.PublicKey
  tokenData: web3.PublicKey
  vault: web3.PublicKey
  userCollateralTokenAccount: web3.PublicKey
  onassetMint: web3.PublicKey
  userOnassetTokenAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initializeBorrowPositionInstructionDiscriminator = [
  101, 93, 229, 188, 115, 151, 231, 124,
]

/**
 * Creates a _InitializeBorrowPosition_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category InitializeBorrowPosition
 * @category generated
 */
export function createInitializeBorrowPositionInstruction(
  accounts: InitializeBorrowPositionInstructionAccounts,
  args: InitializeBorrowPositionInstructionArgs,
  programId = new web3.PublicKey('F7KEvEhxAQ5AXKRSRHruSF55jcUxVv6S45ohkHvStd5v')
) {
  const [data] = initializeBorrowPositionStruct.serialize({
    instructionDiscriminator: initializeBorrowPositionInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.user,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.userAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.clone,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenData,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.vault,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.userCollateralTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.onassetMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.userOnassetTokenAccount,
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
