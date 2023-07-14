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
 * @category AddCollateralToBorrow
 * @category generated
 */
export type AddCollateralToBorrowInstructionArgs = {
  borrowIndex: number
  amount: beet.bignum
}
/**
 * @category Instructions
 * @category AddCollateralToBorrow
 * @category generated
 */
export const addCollateralToBorrowStruct = new beet.BeetArgsStruct<
  AddCollateralToBorrowInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['borrowIndex', beet.u8],
    ['amount', beet.u64],
  ],
  'AddCollateralToBorrowInstructionArgs'
)
/**
 * Accounts required by the _addCollateralToBorrow_ instruction
 *
 * @property [**signer**] user
 * @property [] userAccount
 * @property [] clone
 * @property [_writable_] tokenData
 * @property [_writable_] borrowPositions
 * @property [_writable_] vault
 * @property [_writable_] userCollateralTokenAccount
 * @category Instructions
 * @category AddCollateralToBorrow
 * @category generated
 */
export type AddCollateralToBorrowInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  clone: web3.PublicKey
  tokenData: web3.PublicKey
  borrowPositions: web3.PublicKey
  vault: web3.PublicKey
  userCollateralTokenAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const addCollateralToBorrowInstructionDiscriminator = [
  205, 12, 181, 19, 249, 95, 13, 197,
]

/**
 * Creates a _AddCollateralToBorrow_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category AddCollateralToBorrow
 * @category generated
 */
export function createAddCollateralToBorrowInstruction(
  accounts: AddCollateralToBorrowInstructionAccounts,
  args: AddCollateralToBorrowInstructionArgs,
  programId = new web3.PublicKey('GCXnnWFmt4zFmoAo2nRGe4qQyuusLzDW7CVN484bHMvA')
) {
  const [data] = addCollateralToBorrowStruct.serialize({
    instructionDiscriminator: addCollateralToBorrowInstructionDiscriminator,
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
