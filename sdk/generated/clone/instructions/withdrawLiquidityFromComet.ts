/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category WithdrawLiquidityFromComet
 * @category generated
 */
export type WithdrawLiquidityFromCometInstructionArgs = {
  cometPositionIndex: number
  amount: beet.bignum
}
/**
 * @category Instructions
 * @category WithdrawLiquidityFromComet
 * @category generated
 */
export const withdrawLiquidityFromCometStruct = new beet.BeetArgsStruct<
  WithdrawLiquidityFromCometInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['cometPositionIndex', beet.u8],
    ['amount', beet.u64],
  ],
  'WithdrawLiquidityFromCometInstructionArgs'
)
/**
 * Accounts required by the _withdrawLiquidityFromComet_ instruction
 *
 * @property [**signer**] user
 * @property [_writable_] userAccount
 * @property [_writable_] clone
 * @property [_writable_] pools
 * @property [_writable_] oracles
 * @category Instructions
 * @category WithdrawLiquidityFromComet
 * @category generated
 */
export type WithdrawLiquidityFromCometInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  clone: web3.PublicKey
  pools: web3.PublicKey
  oracles: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const withdrawLiquidityFromCometInstructionDiscriminator = [
  173, 148, 139, 45, 140, 127, 26, 32,
]

/**
 * Creates a _WithdrawLiquidityFromComet_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category WithdrawLiquidityFromComet
 * @category generated
 */
export function createWithdrawLiquidityFromCometInstruction(
  accounts: WithdrawLiquidityFromCometInstructionAccounts,
  args: WithdrawLiquidityFromCometInstructionArgs,
  programId = new web3.PublicKey('F7KEvEhxAQ5AXKRSRHruSF55jcUxVv6S45ohkHvStd5v')
) {
  const [data] = withdrawLiquidityFromCometStruct.serialize({
    instructionDiscriminator:
      withdrawLiquidityFromCometInstructionDiscriminator,
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
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.clone,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.pools,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.oracles,
      isWritable: true,
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
