/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * @category Instructions
 * @category InitializeIncept
 * @category generated
 */
export type InitializeInceptInstructionArgs = {
  ilHealthScoreCutoff: beet.bignum
  ilLiquidationRewardPct: beet.bignum
  maxHealthLiquidation: beet.bignum
  liquidatorFee: beet.bignum
  treasuryAddress: web3.PublicKey
}
/**
 * @category Instructions
 * @category InitializeIncept
 * @category generated
 */
export const initializeInceptStruct = new beet.BeetArgsStruct<
  InitializeInceptInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['ilHealthScoreCutoff', beet.u64],
    ['ilLiquidationRewardPct', beet.u64],
    ['maxHealthLiquidation', beet.u64],
    ['liquidatorFee', beet.u64],
    ['treasuryAddress', beetSolana.publicKey],
  ],
  'InitializeInceptInstructionArgs'
)
/**
 * Accounts required by the _initializeIncept_ instruction
 *
 * @property [_writable_, **signer**] admin
 * @property [_writable_] incept
 * @property [_writable_, **signer**] usdiMint
 * @property [_writable_, **signer**] usdiVault
 * @property [] usdcMint
 * @property [_writable_, **signer**] usdcVault
 * @property [_writable_] tokenData
 * @category Instructions
 * @category InitializeIncept
 * @category generated
 */
export type InitializeInceptInstructionAccounts = {
  admin: web3.PublicKey
  incept: web3.PublicKey
  usdiMint: web3.PublicKey
  usdiVault: web3.PublicKey
  usdcMint: web3.PublicKey
  usdcVault: web3.PublicKey
  tokenData: web3.PublicKey
  rent?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initializeInceptInstructionDiscriminator = [
  86, 144, 73, 222, 3, 129, 131, 205,
]

/**
 * Creates a _InitializeIncept_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category InitializeIncept
 * @category generated
 */
export function createInitializeInceptInstruction(
  accounts: InitializeInceptInstructionAccounts,
  args: InitializeInceptInstructionArgs,
  programId = new web3.PublicKey('6dXq5ocMBYHsVRsGHxckdPmhimip4nisLqR6rqZ8pwt9')
) {
  const [data] = initializeInceptStruct.serialize({
    instructionDiscriminator: initializeInceptInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.admin,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.incept,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.usdiMint,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.usdiVault,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.usdcMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.usdcVault,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.tokenData,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.rent ?? web3.SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenProgram ?? splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
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
