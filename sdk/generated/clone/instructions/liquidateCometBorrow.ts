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
 * @category LiquidateCometBorrow
 * @category generated
 */
export type LiquidateCometBorrowInstructionArgs = {
  cometPositionIndex: number
  liquidityTokenAmount: beet.bignum
}
/**
 * @category Instructions
 * @category LiquidateCometBorrow
 * @category generated
 */
export const liquidateCometBorrowStruct = new beet.BeetArgsStruct<
  LiquidateCometBorrowInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['cometPositionIndex', beet.u8],
    ['liquidityTokenAmount', beet.u64],
  ],
  'LiquidateCometBorrowInstructionArgs'
)
/**
 * Accounts required by the _liquidateCometBorrow_ instruction
 *
 * @property [**signer**] liquidator
 * @property [] user
 * @property [] userAccount
 * @property [_writable_] clone
 * @property [_writable_] tokenData
 * @property [_writable_] comet
 * @property [_writable_] onusdMint
 * @property [_writable_] onassetMint
 * @property [_writable_] ammOnusdTokenAccount
 * @property [_writable_] ammOnassetTokenAccount
 * @property [_writable_] liquidityTokenMint
 * @property [_writable_] cometLiquidityTokenAccount
 * @property [_writable_] liquidatorOnassetTokenAccount
 * @property [_writable_] liquidatorOnusdTokenAccount
 * @property [_writable_] onusdVault
 * @category Instructions
 * @category LiquidateCometBorrow
 * @category generated
 */
export type LiquidateCometBorrowInstructionAccounts = {
  liquidator: web3.PublicKey
  user: web3.PublicKey
  userAccount: web3.PublicKey
  clone: web3.PublicKey
  tokenData: web3.PublicKey
  comet: web3.PublicKey
  onusdMint: web3.PublicKey
  onassetMint: web3.PublicKey
  ammOnusdTokenAccount: web3.PublicKey
  ammOnassetTokenAccount: web3.PublicKey
  liquidityTokenMint: web3.PublicKey
  cometLiquidityTokenAccount: web3.PublicKey
  liquidatorOnassetTokenAccount: web3.PublicKey
  liquidatorOnusdTokenAccount: web3.PublicKey
  onusdVault: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const liquidateCometBorrowInstructionDiscriminator = [
  14, 124, 170, 219, 111, 86, 176, 116,
]

/**
 * Creates a _LiquidateCometBorrow_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category LiquidateCometBorrow
 * @category generated
 */
export function createLiquidateCometBorrowInstruction(
  accounts: LiquidateCometBorrowInstructionAccounts,
  args: LiquidateCometBorrowInstructionArgs,
  programId = new web3.PublicKey('6xmjJPzcUQHb7Dhii4EfqvP8UxanxWYwRSpVY4yAUa2g')
) {
  const [data] = liquidateCometBorrowStruct.serialize({
    instructionDiscriminator: liquidateCometBorrowInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.liquidator,
      isWritable: false,
      isSigner: true,
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
      pubkey: accounts.clone,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenData,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.comet,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.onusdMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.onassetMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.ammOnusdTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.ammOnassetTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.liquidityTokenMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.cometLiquidityTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.liquidatorOnassetTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.liquidatorOnusdTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.onusdVault,
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
