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
 * @category InitiateCometManagerClosing
 * @category generated
 */
export const initiateCometManagerClosingStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'InitiateCometManagerClosingInstructionArgs'
)
/**
 * Accounts required by the _initiateCometManagerClosing_ instruction
 *
 * @property [**signer**] signer
 * @property [_writable_] managerInfo
 * @property [] managerCloneUser
 * @property [] comet
 * @category Instructions
 * @category InitiateCometManagerClosing
 * @category generated
 */
export type InitiateCometManagerClosingInstructionAccounts = {
  signer: web3.PublicKey
  managerInfo: web3.PublicKey
  managerCloneUser: web3.PublicKey
  comet: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const initiateCometManagerClosingInstructionDiscriminator = [
  8, 237, 134, 183, 119, 74, 240, 7,
]

/**
 * Creates a _InitiateCometManagerClosing_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category InitiateCometManagerClosing
 * @category generated
 */
export function createInitiateCometManagerClosingInstruction(
  accounts: InitiateCometManagerClosingInstructionAccounts,
  programId = new web3.PublicKey('HX81GDFSZ9GktdpQCg8N1sBRr1AydZMnkpkNw7dffQym')
) {
  const [data] = initiateCometManagerClosingStruct.serialize({
    instructionDiscriminator:
      initiateCometManagerClosingInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: accounts.signer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: accounts.managerInfo,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.managerCloneUser,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.comet,
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
