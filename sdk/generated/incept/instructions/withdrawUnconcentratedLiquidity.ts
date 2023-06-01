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
 * @category WithdrawUnconcentratedLiquidity
 * @category generated
 */
export type WithdrawUnconcentratedLiquidityInstructionArgs = {
  liquidityPositionIndex: number
  liquidityTokenAmount: beet.bignum
}
/**
 * @category Instructions
 * @category WithdrawUnconcentratedLiquidity
 * @category generated
 */
export const withdrawUnconcentratedLiquidityStruct = new beet.BeetArgsStruct<
  WithdrawUnconcentratedLiquidityInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['liquidityPositionIndex', beet.u8],
    ['liquidityTokenAmount', beet.u64],
  ],
  'WithdrawUnconcentratedLiquidityInstructionArgs'
)
/**
 * Accounts required by the _withdrawUnconcentratedLiquidity_ instruction
 *
 * @property [**signer**] user
 * @property [] userAccount
 * @property [_writable_] incept
 * @property [_writable_] tokenData
 * @property [_writable_] userUsdiTokenAccount
 * @property [_writable_] userIassetTokenAccount
 * @property [_writable_] userLiquidityTokenAccount
 * @property [_writable_] ammUsdiTokenAccount
 * @property [_writable_] ammIassetTokenAccount
 * @property [_writable_] liquidityTokenMint
 * @category Instructions
 * @category WithdrawUnconcentratedLiquidity
 * @category generated
 */
export type WithdrawUnconcentratedLiquidityInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  incept: web3.PublicKey
  tokenData: web3.PublicKey
  userUsdiTokenAccount: web3.PublicKey
  userIassetTokenAccount: web3.PublicKey
  userLiquidityTokenAccount: web3.PublicKey
  ammUsdiTokenAccount: web3.PublicKey
  ammIassetTokenAccount: web3.PublicKey
  liquidityTokenMint: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const withdrawUnconcentratedLiquidityInstructionDiscriminator = [
  222, 185, 17, 74, 87, 48, 51, 4,
]

/**
 * Creates a _WithdrawUnconcentratedLiquidity_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category WithdrawUnconcentratedLiquidity
 * @category generated
 */
export function createWithdrawUnconcentratedLiquidityInstruction(
  accounts: WithdrawUnconcentratedLiquidityInstructionAccounts,
  args: WithdrawUnconcentratedLiquidityInstructionArgs,
  programId = new web3.PublicKey('6dXq5ocMBYHsVRsGHxckdPmhimip4nisLqR6rqZ8pwt9')
) {
  const [data] = withdrawUnconcentratedLiquidityStruct.serialize({
    instructionDiscriminator:
      withdrawUnconcentratedLiquidityInstructionDiscriminator,
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
      pubkey: accounts.userLiquidityTokenAccount,
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
      pubkey: accounts.liquidityTokenMint,
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
