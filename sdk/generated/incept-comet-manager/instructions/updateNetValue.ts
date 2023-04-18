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
 * @category UpdateNetValue
 * @category generated
 */
export const updateNetValueStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'UpdateNetValueInstructionArgs'
)
/**
 * Accounts required by the _updateNetValue_ instruction
 *
 * @property [**signer**] signer
 * @property [_writable_] managerInfo
 * @property [_writable_] managerInceptUser
 * @property [] incept
 * @property [] usdiMint
 * @property [] managerUsdiTokenAccount
 * @property [] usdcMint
 * @property [] managerUsdcTokenAccount
 * @property [] comet
 * @property [] tokenData
 * @category Instructions
 * @category UpdateNetValue
 * @category generated
 */
export type UpdateNetValueInstructionAccounts = {
  signer: web3.PublicKey
  managerInfo: web3.PublicKey
  managerInceptUser: web3.PublicKey
  incept: web3.PublicKey
  usdiMint: web3.PublicKey
  managerUsdiTokenAccount: web3.PublicKey
  usdcMint: web3.PublicKey
  managerUsdcTokenAccount: web3.PublicKey
  comet: web3.PublicKey
  tokenData: web3.PublicKey
  anchorRemainingAccounts?: web3.AccountMeta[]
}

export const updateNetValueInstructionDiscriminator = [
  203, 207, 113, 56, 193, 72, 171, 151,
]

/**
 * Creates a _UpdateNetValue_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category UpdateNetValue
 * @category generated
 */
export function createUpdateNetValueInstruction(
  accounts: UpdateNetValueInstructionAccounts,
  programId = new web3.PublicKey('6HAQXsz7ScT5SueXukgDB8ExE9FKeqj5q1z925SujZsu')
) {
  const [data] = updateNetValueStruct.serialize({
    instructionDiscriminator: updateNetValueInstructionDiscriminator,
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
      pubkey: accounts.managerInceptUser,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: accounts.incept,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.usdiMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.managerUsdiTokenAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.usdcMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.managerUsdcTokenAccount,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.comet,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: accounts.tokenData,
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
