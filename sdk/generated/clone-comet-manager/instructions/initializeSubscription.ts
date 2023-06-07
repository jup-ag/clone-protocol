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
 * @category InitializeSubscription
 * @category generated
 */
export const initializeSubscriptionStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'InitializeSubscriptionInstructionArgs'
)
/**
 * Accounts required by the _initializeSubscription_ instruction
 *
 * @property [_writable_, **signer**] subscriptionOwner
 * @property [_writable_] subscriber
 * @property [] managerInfo
 * @category Instructions
 * @category InitializeSubscription
 * @category generated
 */
export type InitializeSubscriptionInstructionAccounts = {
  subscriptionOwner: web3.PublicKey
  subscriber: web3.PublicKey
  managerInfo: web3.PublicKey
  rent?: web3.PublicKey
  tokenProgram?: web3.PublicKey
  systemProgram?: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initializeSubscriptionInstructionDiscriminator = [
  208, 156, 144, 38, 56, 65, 152, 18,
]

/**
 * Creates a _InitializeSubscription_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category InitializeSubscription
 * @category generated
 */
export function createInitializeSubscriptionInstruction(
  accounts: InitializeSubscriptionInstructionAccounts,
  programId = new web3.PublicKey('HX81GDFSZ9GktdpQCg8N1sBRr1AydZMnkpkNw7dffQym')
) {
  const [data] = initializeSubscriptionStruct.serialize({
    instructionDiscriminator: initializeSubscriptionInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.subscriptionOwner,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: accounts.subscriber,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.managerInfo,
      isWritable: false,
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
