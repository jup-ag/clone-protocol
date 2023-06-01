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
 * @category LiquidateBorrowPosition
 * @category generated
 */
export type LiquidateBorrowPositionInstructionArgs = {
  borrowIndex: number
}
/**
 * @category Instructions
 * @category LiquidateBorrowPosition
 * @category generated
 */
export const liquidateBorrowPositionStruct = new beet.BeetArgsStruct<
  LiquidateBorrowPositionInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['borrowIndex', beet.u8],
  ],
  'LiquidateBorrowPositionInstructionArgs'
)
/**
 * Accounts required by the _liquidateBorrowPosition_ instruction
 *
 * @property [**signer**] liquidator
 * @property [] incept
 * @property [_writable_] tokenData
 * @property [] user
 * @property [] userAccount
 * @property [_writable_] iassetMint
 * @property [_writable_] borrowPositions
 * @property [_writable_] vault
 * @property [_writable_] ammUsdiTokenAccount
 * @property [_writable_] ammIassetTokenAccount
 * @property [_writable_] liquidatorCollateralTokenAccount
 * @property [_writable_] liquidatorIassetTokenAccount
 * @category Instructions
 * @category LiquidateBorrowPosition
 * @category generated
 */
export type LiquidateBorrowPositionInstructionAccounts = {
  liquidator: web3.PublicKey
  incept: web3.PublicKey
  tokenData: web3.PublicKey
  user: web3.PublicKey
  userAccount: web3.PublicKey
  iassetMint: web3.PublicKey
  borrowPositions: web3.PublicKey
  vault: web3.PublicKey
  ammUsdiTokenAccount: web3.PublicKey
  ammIassetTokenAccount: web3.PublicKey
  liquidatorCollateralTokenAccount: web3.PublicKey
  liquidatorIassetTokenAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const liquidateBorrowPositionInstructionDiscriminator = [
  235, 201, 17, 133, 234, 72, 84, 210,
]

/**
 * Creates a _LiquidateBorrowPosition_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category LiquidateBorrowPosition
 * @category generated
 */
export function createLiquidateBorrowPositionInstruction(
  accounts: LiquidateBorrowPositionInstructionAccounts,
  args: LiquidateBorrowPositionInstructionArgs,
  programId = new web3.PublicKey('6dXq5ocMBYHsVRsGHxckdPmhimip4nisLqR6rqZ8pwt9')
) {
  const [data] = liquidateBorrowPositionStruct.serialize({
    instructionDiscriminator: liquidateBorrowPositionInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.liquidator,
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
    {
      pubkey: accounts.user,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.userAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.iassetMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.borrowPositions,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.vault,
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
      pubkey: accounts.liquidatorCollateralTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.liquidatorIassetTokenAccount,
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
