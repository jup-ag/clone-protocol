/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { Tier, tierBeet } from '../types/Tier'

/**
 * Arguments used to create {@link CloneStaking}
 * @category Accounts
 * @category generated
 */
export type CloneStakingArgs = {
  admin: web3.PublicKey
  clnTokenMint: web3.PublicKey
  clnTokenVault: web3.PublicKey
  stakingPeriodSlots: beet.bignum
  bump: number
  numTiers: number
  tiers: Tier[] /* size: 16 */
}

export const cloneStakingDiscriminator = [207, 64, 107, 46, 9, 243, 241, 73]
/**
 * Holds the data for the {@link CloneStaking} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class CloneStaking implements CloneStakingArgs {
  private constructor(
    readonly admin: web3.PublicKey,
    readonly clnTokenMint: web3.PublicKey,
    readonly clnTokenVault: web3.PublicKey,
    readonly stakingPeriodSlots: beet.bignum,
    readonly bump: number,
    readonly numTiers: number,
    readonly tiers: Tier[] /* size: 16 */
  ) {}

  /**
   * Creates a {@link CloneStaking} instance from the provided args.
   */
  static fromArgs(args: CloneStakingArgs) {
    return new CloneStaking(
      args.admin,
      args.clnTokenMint,
      args.clnTokenVault,
      args.stakingPeriodSlots,
      args.bump,
      args.numTiers,
      args.tiers
    )
  }

  /**
   * Deserializes the {@link CloneStaking} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [CloneStaking, number] {
    return CloneStaking.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link CloneStaking} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<CloneStaking> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find CloneStaking account at ${address}`)
    }
    return CloneStaking.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      '6yb6cqAvngy2do4qAFmM24Jda2FfyXcPuQxu4P3Va2F4'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, cloneStakingBeet)
  }

  /**
   * Deserializes the {@link CloneStaking} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [CloneStaking, number] {
    return cloneStakingBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link CloneStaking} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return cloneStakingBeet.serialize({
      accountDiscriminator: cloneStakingDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link CloneStaking}
   */
  static get byteSize() {
    return cloneStakingBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link CloneStaking} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      CloneStaking.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link CloneStaking} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === CloneStaking.byteSize
  }

  /**
   * Returns a readable version of {@link CloneStaking} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      admin: this.admin.toBase58(),
      clnTokenMint: this.clnTokenMint.toBase58(),
      clnTokenVault: this.clnTokenVault.toBase58(),
      stakingPeriodSlots: (() => {
        const x = <{ toNumber: () => number }>this.stakingPeriodSlots
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      bump: this.bump,
      numTiers: this.numTiers,
      tiers: this.tiers,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const cloneStakingBeet = new beet.BeetStruct<
  CloneStaking,
  CloneStakingArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['admin', beetSolana.publicKey],
    ['clnTokenMint', beetSolana.publicKey],
    ['clnTokenVault', beetSolana.publicKey],
    ['stakingPeriodSlots', beet.u64],
    ['bump', beet.u8],
    ['numTiers', beet.u8],
    ['tiers', beet.uniformFixedSizeArray(tierBeet, 16)],
  ],
  CloneStaking.fromArgs,
  'CloneStaking'
)
