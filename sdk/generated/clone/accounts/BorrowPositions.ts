/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'
import { BorrowPosition, borrowPositionBeet } from '../types/BorrowPosition'

/**
 * Arguments used to create {@link BorrowPositions}
 * @category Accounts
 * @category generated
 */
export type BorrowPositionsArgs = {
  owner: web3.PublicKey
  numPositions: beet.bignum
  borrowPositions: BorrowPosition[] /* size: 255 */
}

export const borrowPositionsDiscriminator = [
  123, 236, 225, 55, 245, 211, 139, 156,
]
/**
 * Holds the data for the {@link BorrowPositions} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class BorrowPositions implements BorrowPositionsArgs {
  private constructor(
    readonly owner: web3.PublicKey,
    readonly numPositions: beet.bignum,
    readonly borrowPositions: BorrowPosition[] /* size: 255 */
  ) {}

  /**
   * Creates a {@link BorrowPositions} instance from the provided args.
   */
  static fromArgs(args: BorrowPositionsArgs) {
    return new BorrowPositions(
      args.owner,
      args.numPositions,
      args.borrowPositions
    )
  }

  /**
   * Deserializes the {@link BorrowPositions} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [BorrowPositions, number] {
    return BorrowPositions.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link BorrowPositions} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey,
    commitmentOrConfig?: web3.Commitment | web3.GetAccountInfoConfig
  ): Promise<BorrowPositions> {
    const accountInfo = await connection.getAccountInfo(
      address,
      commitmentOrConfig
    )
    if (accountInfo == null) {
      throw new Error(`Unable to find BorrowPositions account at ${address}`)
    }
    return BorrowPositions.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Provides a {@link web3.Connection.getProgramAccounts} config builder,
   * to fetch accounts matching filters that can be specified via that builder.
   *
   * @param programId - the program that owns the accounts we are filtering
   */
  static gpaBuilder(
    programId: web3.PublicKey = new web3.PublicKey(
      'F7KEvEhxAQ5AXKRSRHruSF55jcUxVv6S45ohkHvStd5v'
    )
  ) {
    return beetSolana.GpaBuilder.fromStruct(programId, borrowPositionsBeet)
  }

  /**
   * Deserializes the {@link BorrowPositions} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [BorrowPositions, number] {
    return borrowPositionsBeet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link BorrowPositions} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return borrowPositionsBeet.serialize({
      accountDiscriminator: borrowPositionsDiscriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link BorrowPositions}
   */
  static get byteSize() {
    return borrowPositionsBeet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link BorrowPositions} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      BorrowPositions.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link BorrowPositions} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === BorrowPositions.byteSize
  }

  /**
   * Returns a readable version of {@link BorrowPositions} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      owner: this.owner.toBase58(),
      numPositions: (() => {
        const x = <{ toNumber: () => number }>this.numPositions
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      borrowPositions: this.borrowPositions,
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const borrowPositionsBeet = new beet.BeetStruct<
  BorrowPositions,
  BorrowPositionsArgs & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['owner', beetSolana.publicKey],
    ['numPositions', beet.u64],
    ['borrowPositions', beet.uniformFixedSizeArray(borrowPositionBeet, 255)],
  ],
  BorrowPositions.fromArgs,
  'BorrowPositions'
)
