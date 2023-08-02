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
 * @category MintAsset
 * @category generated
 */
export type MintAssetInstructionArgs = {
  assetIndex: number
  amount: beet.bignum
}
/**
 * @category Instructions
 * @category MintAsset
 * @category generated
 */
export const mintAssetStruct = new beet.BeetArgsStruct<
  MintAssetInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['assetIndex', beet.u8],
    ['amount', beet.u64],
  ],
  'MintAssetInstructionArgs'
)
/**
 * Accounts required by the _mintAsset_ instruction
 *
 * @property [_writable_] assetMint
 * @property [_writable_] assetTokenAccount
 * @property [] jupiterAccount
 * @category Instructions
 * @category MintAsset
 * @category generated
 */
export type MintAssetInstructionAccounts = {
  assetMint: web3.PublicKey
  assetTokenAccount: web3.PublicKey
  jupiterAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const mintAssetInstructionDiscriminator = [
  84, 175, 211, 156, 56, 250, 104, 118,
]

/**
 * Creates a _MintAsset_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category MintAsset
 * @category generated
 */
export function createMintAssetInstruction(
  accounts: MintAssetInstructionAccounts,
  args: MintAssetInstructionArgs,
  programId = new web3.PublicKey('CS52uHyHj6yod3TCQsrhPS8SqqnvoEHNjtTLoUio5kWB')
) {
  const [data] = mintAssetStruct.serialize({
    instructionDiscriminator: mintAssetInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.assetMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.assetTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.jupiterAccount,
      isWritable: false,
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
