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
 * @category MintUsdc
 * @category generated
 */
export type MintUsdcInstructionArgs = {
  nonce: number
  amount: beet.bignum
}
/**
 * @category Instructions
 * @category MintUsdc
 * @category generated
 */
export const mintUsdcStruct = new beet.BeetArgsStruct<
  MintUsdcInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['nonce', beet.u8],
    ['amount', beet.u64],
  ],
  'MintUsdcInstructionArgs'
)
/**
 * Accounts required by the _mintUsdc_ instruction
 *
 * @property [_writable_] usdcMint
 * @property [_writable_] usdcTokenAccount
 * @property [] jupiterAccount
 * @category Instructions
 * @category MintUsdc
 * @category generated
 */
export type MintUsdcInstructionAccounts = {
  usdcMint: web3.PublicKey
  usdcTokenAccount: web3.PublicKey
  jupiterAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const mintUsdcInstructionDiscriminator = [
  18, 18, 44, 151, 229, 134, 223, 5,
]

/**
 * Creates a _MintUsdc_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category MintUsdc
 * @category generated
 */
export function createMintUsdcInstruction(
  accounts: MintUsdcInstructionAccounts,
  args: MintUsdcInstructionArgs,
  programId = new web3.PublicKey('J2shPGHLAPYe1i6PWuKBTXMzGFDSi1yYUzus5yxekH2a')
) {
  const [data] = mintUsdcStruct.serialize({
    instructionDiscriminator: mintUsdcInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.usdcMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.usdcTokenAccount,
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
