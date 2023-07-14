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
 * @category CollectLpRewards
 * @category generated
 */
export type CollectLpRewardsInstructionArgs = {
  cometPositionIndex: number
}
/**
 * @category Instructions
 * @category CollectLpRewards
 * @category generated
 */
export const collectLpRewardsStruct = new beet.BeetArgsStruct<
  CollectLpRewardsInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['cometPositionIndex', beet.u8],
  ],
  'CollectLpRewardsInstructionArgs'
)
/**
 * Accounts required by the _collectLpRewards_ instruction
 *
 * @property [**signer**] user
 * @property [] userAccount
 * @property [_writable_] clone
 * @property [] tokenData
 * @property [_writable_] comet
 * @property [_writable_] onusdMint
 * @property [_writable_] onassetMint
 * @property [_writable_] userOnusdTokenAccount
 * @property [_writable_] userOnassetTokenAccount
 * @category Instructions
 * @category CollectLpRewards
 * @category generated
 */
export type CollectLpRewardsInstructionAccounts = {
  user: web3.PublicKey
  userAccount: web3.PublicKey
  clone: web3.PublicKey
  tokenData: web3.PublicKey
  comet: web3.PublicKey
  onusdMint: web3.PublicKey
  onassetMint: web3.PublicKey
  userOnusdTokenAccount: web3.PublicKey
  userOnassetTokenAccount: web3.PublicKey
  tokenProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const collectLpRewardsInstructionDiscriminator = [
  141, 134, 109, 237, 96, 31, 249, 148,
]

/**
 * Creates a _CollectLpRewards_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category CollectLpRewards
 * @category generated
 */
export function createCollectLpRewardsInstruction(
  accounts: CollectLpRewardsInstructionAccounts,
  args: CollectLpRewardsInstructionArgs,
  programId = new web3.PublicKey('GCXnnWFmt4zFmoAo2nRGe4qQyuusLzDW7CVN484bHMvA')
) {
  const [data] = collectLpRewardsStruct.serialize({
    instructionDiscriminator: collectLpRewardsInstructionDiscriminator,
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
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenData,
      isWritable: false,
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
      pubkey: accounts.userOnusdTokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.userOnassetTokenAccount,
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
