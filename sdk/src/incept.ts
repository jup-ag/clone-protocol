import * as anchor from "@project-serum/anchor";
import { BN, Program, Provider, Wallet } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Incept as InceptProgram, IDL } from "./idl/incept";
import { signAndSend, sleep } from "./utils";
import {
  PublicKey,
  Connection,
  ConfirmOptions,
  TransactionInstruction,
  Transaction,
  Account
} from "@solana/web3.js";

const RENT_PUBKEY = anchor.web3.SYSVAR_RENT_PUBKEY;
const SYSTEM_PROGRAM_ID = anchor.web3.SystemProgram.programId;

export class Incept {
  connection: Connection;
  network: Network;
  wallet: typeof Wallet;
  programId: PublicKey;
  exchangeAuthority: PublicKey;
  program: Program<InceptProgram>;
  manager: Manager;
  tokenData: TokenData;
  opts?: ConfirmOptions;
  managerAddress: [PublicKey, number];

  private constructor(
    connection: Connection,
    network: Network,
    wallet: typeof Wallet,
    exchangeAuthority = PublicKey.default,
    programId = PublicKey.default,
    opts?: ConfirmOptions
  ) {
    this.managerAddress = [PublicKey.default, 0];
    this.manager = {} as Manager;
    this.tokenData = {} as TokenData;
    this.connection = connection;
    this.network = network;
    this.wallet = wallet;
    this.opts = opts;
    const provider = new Provider(
      connection,
      wallet,
      opts || Provider.defaultOptions()
    );
    switch (network) {
      case Network.LOCAL:
        this.programId = programId;
        this.exchangeAuthority = exchangeAuthority;
        this.program = new Program<InceptProgram>(
          IDL,
          this.programId,
          provider
        );
        break;
      case Network.TEST:
        this.programId = TEST_NET.exchange;
        this.exchangeAuthority = TEST_NET.exchangeAuthority;
        this.program = new Program<InceptProgram>(
          IDL,
          this.programId,
          provider
        );
        break;
      case Network.DEV:
        this.programId = DEV_NET.exchange;
        this.exchangeAuthority = DEV_NET.exchangeAuthority;
        this.program = new Program<InceptProgram>(
          IDL,
          this.programId,
          provider
        );
        break;
      case Network.MAIN:
        this.programId = MAIN_NET.exchange;
        this.exchangeAuthority = MAIN_NET.exchangeAuthority;
        this.program = new Program<InceptProgram>(
          IDL,
          this.programId,
          provider
        );
        break;
      default:
        throw new Error("Not supported");
    }
  }
  public async initializeManager(admin) {
    const managerPubkeyAndBump = await this.getManagerAddress();
    const usdiMint = anchor.web3.Keypair.generate();
    const liquidatedCometUsdiTokenAccount = anchor.web3.Keypair.generate();
    const tokenData = anchor.web3.Keypair.generate();

    await this.program.rpc.initializeManager(managerPubkeyAndBump[1], {
      accounts: {
        admin: admin,
        manager: managerPubkeyAndBump[0],
        usdiMint: usdiMint.publicKey,
        liquidatedCometUsdiTokenAccount:
          liquidatedCometUsdiTokenAccount.publicKey,
        tokenData: tokenData.publicKey,
        rent: RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      },
    });
    this.managerAddress = managerPubkeyAndBump;
    this.manager = (await this.program.account.Manager.fetch(
      this.managerAddress[0]
    )) as Manager;
  }

  public onManagerAccountChange(fn: (state: Manager) => void) {
    this.program.account.Manager.subscribe(this.managerAddress[0]).on(
      "change",
      (state: Manager) => {
        fn(state);
      }
    );
  }

  public onTokenDataChange(fn: (state: TokenData) => void) {
    this.program.account.TokenData.subscribe(this.manager.tokenData).on(
      "change",
      (state: TokenData) => {
        fn(state);
      }
    );
  }

  public async initializeUser(userWalletAddress) {}

  public async addCollateral(admin) {}

  public async addPool(admin) {}

  public async updatePrices() {
    const tokenData = await this.getTokenData();
    const priceFeeds = tokenData.pools
      .filter(
        (pool) => !pool.assetInfo.priceFeedAddress.equals(PublicKey.default)
      )
      .map((pool) => {
        return {
          pubkey: pool.assetInfo.priceFeedAddress,
          isWritable: false,
          isSigner: false,
        };
      });
    return await this.program.rpc.updatePrices({
      remainingAccounts: priceFeeds,
      accounts: {
        manager: this.managerAddress[0],
        tokenData: this.manager.tokenData,
      },
    });
  }

  public async getTokenData() {
    return {} as TokenData;
  }

  public async getManagerAddress() {
    return await PublicKey.findProgramAddress(
      [Buffer.from("manager")],
      this.program.programId
    );
  }

  public async getManagerAccount() {
    return (await this.program.account.Manager.fetch(
      this.managerAddress[0]
    )) as Manager;
  }

  public async getUserAddress(userWalletAddress: PublicKey) {
    const [userPubkey, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("user"), userWalletAddress.toBuffer()],
      this.program.programId
    );
    return { userPubkey, bump };
  }

  public async getUserAccount(userWalletAddress: PublicKey) {
    return (await this.program.account.Manager.fetch(
      this.getUserAddress(userWalletAddress)[0]
    )) as User;
  }

  public async mintUsdi(
    amount: BN,
    user: PublicKey,
    userUsdiTokenAccount: PublicKey,
    userCollateralTokenAccount: PublicKey,
    collateralIndex: number,
    signers?: Array<Account>
  ) {
    const mintUsdiIx = await this.mintUsdiInstruction(
      amount,
      user,
      userUsdiTokenAccount,
      userCollateralTokenAccount,
      collateralIndex
    );
    await signAndSend(
      new Transaction().add(mintUsdiIx),
      signers,
      this.connection
    );
  }

  public async mintUsdiInstruction(
    amount: BN,
    user: PublicKey,
    userUsdiTokenAccount: PublicKey,
    userCollateralTokenAccount: PublicKey,
    collateralIndex: number
  ) {
    let tokenData = await this.getTokenData();
    return (await this.program.instruction.mintUsdi(
      this.managerAddress[1],
      new BN(amount),
      {
        accounts: {
          user: user,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          vault: tokenData.collaterals[collateralIndex].vault,
          usdiMint: this.manager.usdiMint,
          userUsdiTokenAccount: userUsdiTokenAccount,
          userCollateralTokenAccount: userCollateralTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async initializeMintPositions() {}
  public async initializeMintPositionsInstruction(
    user: PublicKey,
    collateralVault: PublicKey,
    userCollateralTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    collateralAmount: BN,
    poolIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAddress = await this.getUserAddress(user);
    let userAccount = await this.getUserAccount(user);

    return (await this.program.instruction.initializeMintPosition(
      this.managerAddress[1],
      userAddress[1],
      new BN(iassetAmount),
      new BN(collateralAmount),
      {
        accounts: {
          user: user,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          userAccount: userAddress[0],
          mintPositions: userAccount.mintPositions,
          vault: collateralVault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          iassetMint: tokenData.pools[poolIndex].assetInfo.iassetMint,
          userIassetTokenAccount: userIassetTokenAccount,
          oracle: tokenData.pools[poolIndex].assetInfo.priceFeedAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async addCollateralToMint() {}
  public async addCollateralToMintInstruction() {}

  public async withdrawCollateralFromMint() {}
  public async withdrawCollateralFromMintInstruction() {}

  public async payBackiAssetToMint() {}
  public async payBackiAssetToMintInstruction() {}

  public async addiAssetToMint() {}
  public async addiAssetToMintInstruction() {}

  public async initializeLiquidityPosition() {}
  public async initializeLiquidityPositionInstruction() {}

  public async provideLiquidity() {}
  public async provideLiquidityInstruction() {}

  public async withdrawLiquidity() {}
  public async withdrawLiquidityInstruction() {}

  public async buySynth() {}
  public async buySynthInstruction() {}

  public async sellSynth() {}
  public async sellSynthInstruction() {}

  public async initializeComet() {}
  public async initializeCometInstruction() {}

  public async addCollateralToComet() {}
  public async addCollateralToCometInstruction() {}

  public async withdrawCollateralFromComet() {}
  public async withdrawCollateralFromCometInstruction() {}

  public async closeComet() {}
  public async closeCometInstruction() {}

  public async recenterComet() {}
  public async recenterCometInstruction() {}

  public async liquidateComet() {}
  public async liquidateCometInstruction() {}

  public async claimLiquidateComet() {}
  public async claimLiquidateCometInstruction() {}
}

export interface Manager {
  usdiMint: PublicKey;
  liquidatedCometUsdi: PublicKey;
  tokenData: PublicKey;
  // admin: PublicKey;
}

export interface User {
  authority: PublicKey;
  cometPositions: PublicKey;
  mintPositions: PublicKey;
  liquidityPositions: PublicKey;
}

export interface TokenData {
  manager: PublicKey;
  numPools: number;
  numCollaterals: number;
  pools: Array<Pool>;
  collaterals: Array<Collateral>;
}

export interface Value {
  val: BN;
  scale: number;
}

export interface AssetInfo {
  iassetMint: PublicKey;
  priceFeedAddress: PublicKey;
  price: Value;
  twap: Value;
  confidence: Value;
  status: number;
  lastUpdate: BN;
  stableCollateralRatio: Value;
  cryptoCollateralRatio: Value;
}

export interface Pool {
  iassetTokenAccount: PublicKey;
  usdiTokenAccount: PublicKey;
  liquidityTokenMint: PublicKey;
  liquidationIassetTokenAccount: PublicKey;
  cometLiquidityTokenAccount: PublicKey;
  assetInfo: AssetInfo;
}

export interface Collateral {
  poolIndex: number;
  mint: PublicKey;
  vault: PublicKey;
  vaultUsdiSupply: Value;
  vaultMintSupply: Value;
  vaultCometSupply: Value;
  status: number;
}
