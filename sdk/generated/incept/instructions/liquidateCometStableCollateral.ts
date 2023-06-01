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
 * @category LiquidateCometStableCollateral
 * @category generated
 */
export type LiquidateCometStableCollateralInstructionArgs = {
  cometCollateralIndex: number
}
/**
 * @category Instructions
 * @category LiquidateCometStableCollateral
 * @category generated
 */
export const liquidateCometStableCollateralStruct = new beet.BeetArgsStruct<
  LiquidateCometStableCollateralInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['cometCollateralIndex', beet.u8],
  ],
  'LiquidateCometStableCollateralInstructionArgs'
)
/**
 * Accounts required by the _liquidateCometStableCollateral_ instruction
 *
 * @property [**signer**] liquidator
 * @property [] incept
 * @property [] tokenData
 * @property [] user
 * @property [] userAccount
 * @property [_writable_] comet
 * @property [_writable_] usdiMint
 * @property [_writable_] vault
 * @property [_writable_] usdiVault
 * @category Instructions
 * @category LiquidateCometStableCollateral
 * @category generated
 */
export type LiquidateCometStableCollateralInstructionAccounts = {
  liquidator: web3.PublicKey
  incept: web3.PublicKey
  tokenData: web3.PublicKey
  user: web3.PublicKey
  userAccount: web3.PublicKey
  comet: web3.PublicKey
  usdiMint: web3.PublicKey
  vault: web3.PublicKey
  usdiVault: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const liquidateCometStableCollateralInstructionDiscriminator = [
  99, 92, 170, 102, 155, 88, 27, 100,
]

/**
 * Creates a _LiquidateCometStableCollateral_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category LiquidateCometStableCollateral
 * @category generated
 */
export function createLiquidateCometStableCollateralInstruction(
  accounts: LiquidateCometStableCollateralInstructionAccounts,
  args: LiquidateCometStableCollateralInstructionArgs,
  programId = new web3.PublicKey('6dXq5ocMBYHsVRsGHxckdPmhimip4nisLqR6rqZ8pwt9')
) {
  const [data] = liquidateCometStableCollateralStruct.serialize({
    instructionDiscriminator:
      liquidateCometStableCollateralInstructionDiscriminator,
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
      isWritable: false,
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
      pubkey: accounts.comet,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.usdiMint,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.vault,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.usdiVault,
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
