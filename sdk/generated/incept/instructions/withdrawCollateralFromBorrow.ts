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
 * @category WithdrawCollateralFromBorrow
 * @category generated
 */
export type WithdrawCollateralFromBorrowInstructionArgs = {
  borrowIndex: number
  amount: beet.bignum
}
/**
 * @category Instructions
 * @category WithdrawCollateralFromBorrow
 * @category generated
 */
export const withdrawCollateralFromBorrowStruct = new beet.BeetArgsStruct<
  WithdrawCollateralFromBorrowInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['borrowIndex', beet.u8],
    ['amount', beet.u64],
  ],
  'WithdrawCollateralFromBorrowInstructionArgs'
)
/**
 * Accounts required by the _withdrawCollateralFromBorrow_ instruction
 *
 * @property [**signer**] user
 * @property [] userAccount
 * @property [] incept
 * @property [_writable_] tokenData
 * @property [_writable_] borrowPositions
 * @property [_writable_] vault
 * @property [_writable_] userCollateralTokenAccount
 * @category Instructions
 * @category WithdrawCollateralFromBorrow
 * @category generated
 */
export type WithdrawCollateralFromBorrowInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  incept: web3.PublicKey
  tokenData: web3.PublicKey
  borrowPositions: web3.PublicKey
  vault: web3.PublicKey
  userCollateralTokenAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const withdrawCollateralFromBorrowInstructionDiscriminator = [
  192, 177, 60, 105, 57, 92, 160, 221,
]

/**
 * Creates a _WithdrawCollateralFromBorrow_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category WithdrawCollateralFromBorrow
 * @category generated
 */
export function createWithdrawCollateralFromBorrowInstruction(
  accounts: WithdrawCollateralFromBorrowInstructionAccounts,
  args: WithdrawCollateralFromBorrowInstructionArgs,
  programId = new web3.PublicKey('6dXq5ocMBYHsVRsGHxckdPmhimip4nisLqR6rqZ8pwt9')
) {
  const [data] = withdrawCollateralFromBorrowStruct.serialize({
    instructionDiscriminator:
      withdrawCollateralFromBorrowInstructionDiscriminator,
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
      pubkey: accounts.userCollateralTokenAccount,
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
