import * as anchor from "@project-serum/anchor";
import { BN, Program, Provider, Wallet } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { Incept as InceptProgram, IDL } from "./idl/incept";
import {
  PublicKey,
  Connection,
  ConfirmOptions,
  TransactionInstruction,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import { sleep, toScaledNumber, toScaledPercent, div, mul } from "./utils";

const RENT_PUBKEY = anchor.web3.SYSVAR_RENT_PUBKEY;
const SYSTEM_PROGRAM_ID = anchor.web3.SystemProgram.programId;

const TOKEN_DATA_SIZE = 157168;
const COMET_POSITIONS_SIZE = 59208;
const MINT_POSITIONS_SIZE = 24528;
const LIQUIDITY_POSITIONS_SIZE = 16368;
const MULTI_POOL_POSITION_SIZE = 55160;

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export class Incept {
  connection: Connection;
  programId: PublicKey;
  program: Program<InceptProgram>;
  manager: Manager;
  opts?: ConfirmOptions;
  managerAddress: [PublicKey, number];
  provider: Provider;

  public constructor(
    programId: PublicKey,
    provider: Provider,
    opts?: ConfirmOptions
  ) {
    this.managerAddress = [PublicKey.default, 0];
    this.connection = provider.connection;
    this.programId = programId;
    this.provider = provider;
    this.opts = opts;
    this.program = new Program<InceptProgram>(IDL, this.programId, provider);
  }
  public async initializeManager(chainlinkProgram: PublicKey) {
    const managerPubkeyAndBump = await this.getManagerAddress();
    const usdiMint = anchor.web3.Keypair.generate();
    const liquidatedCometUsdiTokenAccount = anchor.web3.Keypair.generate();
    const tokenData = anchor.web3.Keypair.generate();

    await this.program.rpc.initializeManager(managerPubkeyAndBump[1], {
      accounts: {
        admin: this.provider.wallet.publicKey,
        manager: managerPubkeyAndBump[0],
        usdiMint: usdiMint.publicKey,
        liquidatedCometUsdiTokenAccount:
          liquidatedCometUsdiTokenAccount.publicKey,
        tokenData: tokenData.publicKey,
        rent: RENT_PUBKEY,
        chainlinkProgram: chainlinkProgram,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      },
      instructions: [
        // @ts-ignore
        await this.program.account.tokenData.createInstruction(
          tokenData,
          TOKEN_DATA_SIZE
        ),
      ],
      signers: [usdiMint, tokenData, liquidatedCometUsdiTokenAccount],
    });
    this.managerAddress = managerPubkeyAndBump;
    // @ts-ignore
    this.manager = (await this.program.account.manager.fetch(
      this.managerAddress[0]
    )) as Manager;
  }

  public async loadManager() {
    this.managerAddress = await this.getManagerAddress();
    // @ts-ignore
    this.manager = (await this.getManagerAccount()) as Manager;
  }

  public onManagerAccountChange(fn: (state: Manager) => void) {
    this.program.account.manager
      .subscribe(this.managerAddress[0])
      .on("change", (state: Manager) => {
        fn(state);
      });
  }

  public onTokenDataChange(fn: (state: TokenData) => void) {
    this.program.account.tokenData
      .subscribe(this.manager.tokenData)
      .on("change", (state: TokenData) => {
        fn(state);
      });
  }

  public async getCollateral(collateralIndex: number) {
    const tokenData = (await this.getTokenData()) as TokenData;
    return tokenData.collaterals[collateralIndex];
  }

  public async initializeUser() {
    const { userPubkey, bump } = await this.getUserAddress();

    const cometPositionsAccount = anchor.web3.Keypair.generate();
    const mintPositionsAccount = anchor.web3.Keypair.generate();
    const liquidityPositionsAccount = anchor.web3.Keypair.generate();
    const multiPoolCometAccount = anchor.web3.Keypair.generate();

    await this.program.rpc.initializeUser(bump, {
      accounts: {
        user: this.provider.wallet.publicKey,
        userAccount: userPubkey,
        cometPositions: cometPositionsAccount.publicKey,
        mintPositions: mintPositionsAccount.publicKey,
        liquidityPositions: liquidityPositionsAccount.publicKey,
        multiPoolComet: multiPoolCometAccount.publicKey,
        usdiMint: this.manager.usdiMint,
        rent: RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      },
      instructions: [
        // @ts-ignore
        await this.program.account.cometPositions.createInstruction(
          cometPositionsAccount,
          COMET_POSITIONS_SIZE
        ),
        // @ts-ignore
        await this.program.account.mintPositions.createInstruction(
          mintPositionsAccount,
          MINT_POSITIONS_SIZE
        ),
        // @ts-ignore
        await this.program.account.liquidityPositions.createInstruction(
          liquidityPositionsAccount,
          LIQUIDITY_POSITIONS_SIZE
        ),
        // @ts-ignore
        await this.program.account.multiPoolComet.createInstruction(
          multiPoolCometAccount,
          MULTI_POOL_POSITION_SIZE
        ),
      ],
      signers: [
        cometPositionsAccount,
        mintPositionsAccount,
        liquidityPositionsAccount,
        multiPoolCometAccount,
      ],
    });
  }

  public async addCollateral(
    admin: PublicKey,
    scale: number,
    stable: number,
    collateral_mint: PublicKey
  ) {
    const vaultAccount = anchor.web3.Keypair.generate();

    await this.program.rpc.addCollateral(
      this.managerAddress[1],
      scale,
      stable,
      {
        accounts: {
          admin: admin,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          collateralMint: collateral_mint,
          vault: vaultAccount.publicKey,
          rent: RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
        },
        signers: [vaultAccount],
      }
    );
  }

  public async initializePool(
    admin: PublicKey,
    stableCollateralRatio: number,
    cryptoCollateralRatio: number,
    pythOracle: PublicKey,
    chainlinkOracle: PublicKey
  ) {
    const usdiTokenAccount = anchor.web3.Keypair.generate();
    const iassetMintAccount = anchor.web3.Keypair.generate();
    const iassetTokenAccount = anchor.web3.Keypair.generate();
    const liquidationIassetTokenAccount = anchor.web3.Keypair.generate();
    const liquidityTokenMintAccount = anchor.web3.Keypair.generate();
    const cometLiquidityTokenAccount = anchor.web3.Keypair.generate();

    await this.program.rpc.initializePool(
      this.managerAddress[1],
      stableCollateralRatio,
      cryptoCollateralRatio,
      {
        accounts: {
          admin: admin,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          usdiTokenAccount: usdiTokenAccount.publicKey,
          iassetMint: iassetMintAccount.publicKey,
          iassetTokenAccount: iassetTokenAccount.publicKey,
          liquidationIassetTokenAccount:
            liquidationIassetTokenAccount.publicKey,
          liquidityTokenMint: liquidityTokenMintAccount.publicKey,
          cometLiquidityTokenAccount: cometLiquidityTokenAccount.publicKey,
          pythOracle: pythOracle,
          chainlinkOracle: chainlinkOracle,
          rent: RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
        },
        signers: [
          usdiTokenAccount,
          iassetMintAccount,
          iassetTokenAccount,
          liquidationIassetTokenAccount,
          liquidityTokenMintAccount,
          cometLiquidityTokenAccount,
        ],
      }
    );
  }

  public async getPool(poolIndex: number) {
    const tokenData = (await this.getTokenData()) as TokenData;
    return tokenData.pools[poolIndex];
  }

  public async getPoolBalances(poolIndex: number) {
    let pool = await this.getPool(poolIndex);

		let iasset = 0
		let usdi = 0

		try {
			iasset = Number(
				(await this.connection.getTokenAccountBalance(pool.iassetTokenAccount, 'confirmed')).value!.uiAmount
			)
		} catch {}

		try {
			usdi = Number(
				(await this.connection.getTokenAccountBalance(pool.usdiTokenAccount, 'confirmed')).value!.uiAmount
			)
		} catch {}
    return [Number(iasset), Number(usdi)];
  }

  public async getAssetInfo(poolIndex: number) {
    const tokenData = (await this.getTokenData()) as TokenData;
    return tokenData.pools[poolIndex].assetInfo as AssetInfo;
  }

  public async updatePrices(signers?: Array<Keypair>, poolIndex?: number) {
    const updatePricesIx = await this.updatePricesInstruction(poolIndex);
    await this.provider.send(new Transaction().add(updatePricesIx), signers);
  }

  //NOTE: It seems like with too many pools (10) the maximum number of allowed transactions can be exceeded.
  public async updatePricesInstruction(poolIndex?: number) {
    const tokenData = await this.getTokenData();

    let priceFeeds: Array<{pubkey: PublicKey, isWritable: boolean, isSigner: boolean}> = [];
    tokenData.pools.slice(0, Number(tokenData.numPools)).forEach((pool) => {
      priceFeeds.push({
        pubkey: pool.assetInfo.priceFeedAddresses[0],
        isWritable: false,
        isSigner: false,
      });
      priceFeeds.push({
        pubkey: pool.assetInfo.priceFeedAddresses[1],
        isWritable: false,
        isSigner: false,
      });
    });

    if (typeof poolIndex !== 'undefined') {
      priceFeeds = priceFeeds.slice(2 * poolIndex, 2 * poolIndex + 2);
    }

    return (await this.program.instruction.updatePrices(
      this.managerAddress[1],
      {
        remainingAccounts: priceFeeds,
        accounts: {
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          chainlinkProgram: tokenData.chainlinkProgram,
        },
      }
    )) as TransactionInstruction;
  }

  public async getTokenData() {
    return (await this.program.account.tokenData.fetch(
      this.manager.tokenData
    )) as TokenData;
  }

  public async getLiquidityPositions() {
    const userAccountData = (await this.getUserAccount()) as User;
    return (await this.program.account.liquidityPositions.fetch(
      userAccountData.liquidityPositions
    )) as LiquidityPositions;
  }

  public async getLiquidityPosition(liquidityIndex: number) {
    return (await this.getLiquidityPositions()).liquidityPositions[
      liquidityIndex
    ];
  }

  public async getMintPositions() {
    const userAccountData = (await this.getUserAccount()) as User;
    // @ts-ignore
    return (await this.program.account.mintPositions.fetch(
      userAccountData.mintPositions
    )) as MintPositions;
  }
  public async getMintPosition(mintIndex: number) {
    return (await this.getMintPositions()).mintPositions[mintIndex];
  }

  public async getCometPositions(address?: PublicKey) {
    const userAccountData = (await this.getUserAccount(address)) as User;
    // @ts-ignore
    return (await this.program.account.cometPositions.fetch(
      userAccountData.cometPositions
    )) as CometPositions;
  }
  public async getCometPosition(cometIndex: number) {
    const cometPositions = (await this.getCometPositions()) as CometPositions;
    return cometPositions.cometPositions[cometIndex] as CometPosition;
  }

  public async getMultiPoolComet(forManager?: boolean, address?: PublicKey) {
    const userAccountData = (await this.getUserAccount(address)) as User;
    // @ts-ignore
    return (await this.program.account.multiPoolComet.fetch(
      forManager ? userAccountData.cometManager : userAccountData.multiPoolComet
    )) as MultiPoolComet;
  }

  public async getManagerAddress() {
    return await PublicKey.findProgramAddress(
      [Buffer.from("manager")],
      this.program.programId
    );
  }

  public async getUserAddress(address?: PublicKey) {
    if (!address) {
      address = this.provider.wallet.publicKey;
    }

    const [userPubkey, bump] = await PublicKey.findProgramAddress(
      [Buffer.from("user"), address.toBuffer()],
      this.program.programId
    );
    return { userPubkey, bump };
  }

  public async getUserAccount(address?: PublicKey) {
    if (!address) {
      const { userPubkey, bump } = await this.getUserAddress();
      address = userPubkey;
    }

    return (await this.program.account.user.fetch(address)) as User;
  }

  public async mintUsdi(
    amount: BN,
    userUsdiTokenAccount: PublicKey,
    userCollateralTokenAccount: PublicKey,
    collateralIndex: number,
    signers?: Array<Keypair>
  ) {
    const mintUsdiIx = (await this.mintUsdiInstruction(
      amount,
      userUsdiTokenAccount,
      userCollateralTokenAccount,
      collateralIndex
    )) as TransactionInstruction;
    await this.provider.send(new Transaction().add(mintUsdiIx), signers);
  }

  public async mintUsdiInstruction(
    amount: BN,
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
          user: this.provider.wallet.publicKey,
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

  public async initializeMintPositions(
    iassetAmount: BN,
    collateralAmount: BN,
    userCollateralTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    poolIndex: number,
    collateralIndex: number,
    signers?: Array<Keypair>
  ) {
    const updatePricesIx = await this.updatePricesInstruction(poolIndex);
    const initializeMintPositionsIx =
      await this.initializeMintPositionsInstruction(
        userCollateralTokenAccount,
        userIassetTokenAccount,
        iassetAmount,
        collateralAmount,
        poolIndex,
        collateralIndex
      );
    await this.provider.send(
      new Transaction().add(updatePricesIx).add(initializeMintPositionsIx),
      signers
    );
  }
  public async initializeMintPositionsInstruction(
    userCollateralTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    collateralAmount: BN,
    poolIndex: number,
    collateralIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();

    return (await this.program.instruction.initializeMintPosition(
      this.managerAddress[1],
      iassetAmount,
      collateralAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          mintPositions: userAccount.mintPositions,
          vault: tokenData.collaterals[collateralIndex].vault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          iassetMint: tokenData.pools[poolIndex].assetInfo.iassetMint,
          userIassetTokenAccount: userIassetTokenAccount,
          oracle: tokenData.pools[poolIndex].assetInfo.priceFeedAddresses[0],
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async addCollateralToMint(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number,
    signers?: Array<Keypair>
  ) {
    const addCollateralToMintIx = await this.addCollateralToMintInstruction(
      userCollateralTokenAccount,
      collateralAmount,
      collateralIndex
    );
    await this.provider.send(
      new Transaction().add(addCollateralToMintIx),
      signers
    );
  }

  public async addCollateralToMintInstruction(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();

    return (await this.program.instruction.addCollateralToMint(
      this.managerAddress[1],
      collateralIndex,
      collateralAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          mintPositions: userAccount.mintPositions,
          vault: tokenData.collaterals[collateralIndex].vault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async withdrawCollateralFromMint(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number,
    signers?: Array<Keypair>
  ) {
    const updatePricesIx = await this.updatePricesInstruction();
    const withdrawCollateralFromMintIx =
      await this.withdrawCollateralFromMintInstruction(
        this.provider.wallet.publicKey,
        userCollateralTokenAccount,
        collateralAmount,
        collateralIndex
      );
    await this.provider.send(
      new Transaction().add(updatePricesIx).add(withdrawCollateralFromMintIx),
      signers
    );
  }

  public async withdrawCollateralFromMintInstruction(
    user: PublicKey,
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();

    return (await this.program.instruction.withdrawCollateralFromMint(
      this.managerAddress[1],
      collateralIndex,
      collateralAmount,
      {
        accounts: {
          user: user,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          mintPositions: userAccount.mintPositions,
          vault: tokenData.collaterals[collateralIndex].vault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async payBackiAssetToMint(
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    mintIndex: number,
    signers: Array<Keypair>
  ) {
    const payBackiAssetToMintIx = await this.payBackiAssetToMintInstruction(
      userIassetTokenAccount,
      iassetAmount,
      mintIndex
    );
    await this.provider.send(
      new Transaction().add(payBackiAssetToMintIx),
      signers
    );
  }
  public async payBackiAssetToMintInstruction(
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    mintIndex: number
  ) {
    let mint = await this.getMintPosition(mintIndex);
    let assetInfo = await this.getAssetInfo(mint.poolIndex);
    let userAccount = await this.getUserAccount();

    return (await this.program.instruction.payBackMint(
      this.managerAddress[1],
      mintIndex,
      iassetAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          mintPositions: userAccount.mintPositions,
          iassetMint: assetInfo.iassetMint,
          userIassetTokenAccount: userIassetTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async addiAssetToMint(
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    mintIndex: number,
    signers: Array<Keypair>
  ) {
    const updatePricesIx = await this.updatePricesInstruction();
    const addiAssetToMintIx = await this.addiAssetToMintInstruction(
      userIassetTokenAccount,
      iassetAmount,
      mintIndex
    );
    await this.provider.send(
      new Transaction().add(updatePricesIx).add(addiAssetToMintIx),
      signers
    );
  }
  public async addiAssetToMintInstruction(
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    mintIndex: number
  ) {
    let mint = await this.getMintPosition(mintIndex);
    let assetInfo = await this.getAssetInfo(mint.poolIndex);
    let userAccount = await this.getUserAccount();

    return (await this.program.instruction.addIassetToMint(
      this.managerAddress[1],
      mintIndex,
      iassetAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          mintPositions: userAccount.mintPositions,
          iassetMint: assetInfo.iassetMint,
          userIassetTokenAccount: userIassetTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async initializeLiquidityPosition(
    iassetAmount: BN,
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userLiquidityTokenAccount: PublicKey,
    poolIndex: number,
    signers?: Array<Keypair>
  ) {
    const initializeLiquidityPositionIx =
      await this.initializeLiquidityPositionInstruction(
        userUsdiTokenAccount,
        userIassetTokenAccount,
        userLiquidityTokenAccount,
        iassetAmount,
        poolIndex
      );
    await this.provider.send(
      new Transaction().add(initializeLiquidityPositionIx),
      signers
    );
  }
  public async initializeLiquidityPositionInstruction(
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userLiquidityTokenAccount: PublicKey,
    iassetAmount: BN,
    poolIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let pool = await tokenData.pools[poolIndex];

    return (await this.program.instruction.initializeLiquidityPosition(
      this.managerAddress[1],
      poolIndex,
      iassetAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          liquidityPositions: userAccount.liquidityPositions,
          userUsdiTokenAccount: userUsdiTokenAccount,
          userIassetTokenAccount: userIassetTokenAccount,
          userLiquidityTokenAccount: userLiquidityTokenAccount,
          ammUsdiTokenAccount: pool.usdiTokenAccount,
          ammIassetTokenAccount: pool.iassetTokenAccount,
          liquidityTokenMint: pool.liquidityTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async provideLiquidity(
    iassetAmount: BN,
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userLiquidityTokenAccount: PublicKey,
    poolIndex: number,
    signers?: Array<Keypair>
  ) {
    const provideLiquidityIx = await this.provideLiquidityInstruction(
      userUsdiTokenAccount,
      userIassetTokenAccount,
      userLiquidityTokenAccount,
      iassetAmount,
      poolIndex
    );
    await this.provider.send(
      new Transaction().add(provideLiquidityIx),
      signers
    );
  }
  public async provideLiquidityInstruction(
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userLiquidityTokenAccount: PublicKey,
    iassetAmount: BN,
    poolIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let pool = tokenData.pools[poolIndex];

    //let userLiquidityPosition = await this.getLiquidityPosition(poolIndex);

    return (await this.program.instruction.provideLiquidity(
      this.managerAddress[1],
      poolIndex,
      iassetAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          liquidityPositions: userAccount.liquidityPositions,
          userUsdiTokenAccount: userUsdiTokenAccount,
          userIassetTokenAccount: userIassetTokenAccount,
          userLiquidityTokenAccount: userLiquidityTokenAccount,
          ammUsdiTokenAccount: pool.usdiTokenAccount,
          ammIassetTokenAccount: pool.iassetTokenAccount,
          liquidityTokenMint: pool.liquidityTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async withdrawLiquidity(
    iassetAmount: BN,
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userLiquidityTokenAccount: PublicKey,
    poolIndex: number,
    signers?: Array<Keypair>
  ) {
    const withdrawLiquidityIx = await this.withdrawLiquidityInstruction(
      userUsdiTokenAccount,
      userIassetTokenAccount,
      userLiquidityTokenAccount,
      iassetAmount,
      poolIndex
    );
    await this.provider.send(
      new Transaction().add(withdrawLiquidityIx),
      signers
    );
  }
  public async withdrawLiquidityInstruction(
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userLiquidityTokenAccount: PublicKey,
    iassetAmount: BN,
    poolIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();

    let pool = tokenData.pools[poolIndex];

    return (await this.program.instruction.withdrawLiquidity(
      this.managerAddress[1],
      poolIndex,
      iassetAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          liquidityPositions: userAccount.liquidityPositions,
          userUsdiTokenAccount: userUsdiTokenAccount,
          userIassetTokenAccount: userIassetTokenAccount,
          userLiquidityTokenAccount: userLiquidityTokenAccount,
          ammUsdiTokenAccount: pool.usdiTokenAccount,
          ammIassetTokenAccount: pool.iassetTokenAccount,
          liquidityTokenMint: pool.liquidityTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async buySynth(
    iassetAmount: BN,
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    poolIndex: number,
    signers?: Array<Keypair>
  ) {
    const buySynthIx = await this.buySynthInstruction(
      userUsdiTokenAccount,
      userIassetTokenAccount,
      iassetAmount,
      poolIndex
    );
    await this.provider.send(new Transaction().add(buySynthIx), signers);
  }
  public async buySynthInstruction(
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    poolIndex: number
  ) {
    let tokenData = await this.getTokenData();

    return (await this.program.instruction.buySynth(
      this.managerAddress[1],
      poolIndex,
      iassetAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          userUsdiTokenAccount: userUsdiTokenAccount,
          userIassetTokenAccount: userIassetTokenAccount,
          ammUsdiTokenAccount: tokenData.pools[poolIndex].usdiTokenAccount,
          ammIassetTokenAccount: tokenData.pools[poolIndex].iassetTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async sellSynth(
    iassetAmount: BN,
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    poolIndex: number,
    signers?: Array<Keypair>
  ) {
    const buySynthIx = await this.sellSynthInstruction(
      userUsdiTokenAccount,
      userIassetTokenAccount,
      iassetAmount,
      poolIndex
    );
    await this.provider.send(new Transaction().add(buySynthIx), signers);
  }
  public async sellSynthInstruction(
    userUsdiTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    iassetAmount: BN,
    poolIndex: number
  ) {
    let tokenData = await this.getTokenData();

    return (await this.program.instruction.sellSynth(
      this.managerAddress[1],
      poolIndex,
      iassetAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          userUsdiTokenAccount: userUsdiTokenAccount,
          userIassetTokenAccount: userIassetTokenAccount,
          ammUsdiTokenAccount: tokenData.pools[poolIndex].usdiTokenAccount,
          ammIassetTokenAccount: tokenData.pools[poolIndex].iassetTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async initializeComet(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    usdiAmount: BN,
    poolIndex: number,
    collateralIndex: number,
    signers?: Array<Keypair>
  ) {
    const initializeCometIx = await this.initializeCometInstruction(
      userCollateralTokenAccount,
      collateralAmount,
      usdiAmount,
      poolIndex,
      collateralIndex
    );
    await this.provider.send(new Transaction().add(initializeCometIx), signers);
  }
  public async initializeCometInstruction(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    usdiAmount: BN,
    poolIndex: number,
    collateralIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();

    return (await this.program.instruction.initializeComet(
      this.managerAddress[1],
      poolIndex,
      collateralAmount,
      usdiAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint: tokenData.pools[poolIndex].assetInfo.iassetMint,
          userCollateralTokenAccount: userCollateralTokenAccount,
          cometPositions: userAccount.cometPositions,
          ammUsdiTokenAccount: tokenData.pools[poolIndex].usdiTokenAccount,
          ammIassetTokenAccount: tokenData.pools[poolIndex].iassetTokenAccount,
          liquidityTokenMint: tokenData.pools[poolIndex].liquidityTokenMint,
          cometLiquidityTokenAccount:
            tokenData.pools[poolIndex].cometLiquidityTokenAccount,
          vault: tokenData.collaterals[collateralIndex].vault,
          rent: RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async addCollateralToComet(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    cometIndex: number,
    signers?: Array<Keypair>
  ) {
    const addCollateralToCometIx = await this.addCollateralToCometInstruction(
      userCollateralTokenAccount,
      collateralAmount,
      cometIndex
    );
    await this.provider.send(
      new Transaction().add(addCollateralToCometIx),
      signers
    );
  }
  public async addCollateralToCometInstruction(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    cometIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let cometPosition = await this.getCometPosition(cometIndex);

    return (await this.program.instruction.addCollateralToComet(
      this.managerAddress[1],
      cometIndex,
      collateralAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          cometPositions: userAccount.cometPositions,
          vault: tokenData.collaterals[cometPosition.collateralIndex].vault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          ammUsdiTokenAccount:
            tokenData.pools[cometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[cometPosition.poolIndex].iassetTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async withdrawCollateralFromComet(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    cometIndex: number,
    signers?: Array<Keypair>
  ) {
    const withdrawCollateralFromCometIx =
      await this.withdrawCollateralFromCometInstruction(
        userCollateralTokenAccount,
        collateralAmount,
        cometIndex
      );
    await this.provider.send(
      new Transaction().add(withdrawCollateralFromCometIx),
      signers
    );
  }
  public async withdrawCollateralFromCometInstruction(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    cometIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let cometPosition = await this.getCometPosition(cometIndex);

    return (await this.program.instruction.withdrawCollateralFromComet(
      this.managerAddress[1],
      cometIndex,
      collateralAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          cometPositions: userAccount.cometPositions,
          vault: tokenData.collaterals[cometPosition.collateralIndex].vault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          ammUsdiTokenAccount:
            tokenData.pools[cometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[cometPosition.poolIndex].iassetTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async addLiquidityToComet(
    usdiAmount: BN,
    cometIndex: number,
    signers?: Array<Keypair>
  ) {
    const withdrawCollateralFromCometIx =
      await this.addLiquidityToCometInstruction(usdiAmount, cometIndex);
    await this.provider.send(
      new Transaction().add(withdrawCollateralFromCometIx),
      signers
    );
  }
  public async addLiquidityToCometInstruction(
    usdiAmount: BN,
    cometIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let cometPosition = await this.getCometPosition(cometIndex);

    return (await this.program.instruction.addLiquidityToComet(
      this.managerAddress[1],
      cometIndex,
      usdiAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[cometPosition.poolIndex].assetInfo.iassetMint,
          cometPositions: userAccount.cometPositions,
          ammUsdiTokenAccount:
            tokenData.pools[cometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[cometPosition.poolIndex].iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[cometPosition.poolIndex].liquidityTokenMint,
          cometLiquidityTokenAccount:
            tokenData.pools[cometPosition.poolIndex].cometLiquidityTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async withdrawLiquidityFromComet(
    usdiAmount: BN,
    cometIndex: number,
    signers?: Array<Keypair>
  ) {
    const withdrawCollateralFromCometIx =
      await this.withdrawLiquidityFromCometInstruction(usdiAmount, cometIndex);
    await this.provider.send(
      new Transaction().add(withdrawCollateralFromCometIx),
      signers
    );
  }
  public async withdrawLiquidityFromCometInstruction(
    usdiAmount: BN,
    cometIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let cometPosition = await this.getCometPosition(cometIndex);

    return (await this.program.instruction.withdrawLiquidityFromComet(
      this.managerAddress[1],
      cometIndex,
      usdiAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[cometPosition.poolIndex].assetInfo.iassetMint,
          cometPositions: userAccount.cometPositions,
          ammUsdiTokenAccount:
            tokenData.pools[cometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[cometPosition.poolIndex].iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[cometPosition.poolIndex].liquidityTokenMint,
          cometLiquidityTokenAccount:
            tokenData.pools[cometPosition.poolIndex].cometLiquidityTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async closeComet(
    userCollateralTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userUsdiTokenAccount: PublicKey,
    cometIndex: number,
    signers?: Array<Keypair>
  ) {
    const closeCometIx = await this.closeCometInstruction(
      userCollateralTokenAccount,
      userIassetTokenAccount,
      userUsdiTokenAccount,
      cometIndex
    );
    await this.provider.send(new Transaction().add(closeCometIx), signers);
  }
  public async closeCometInstruction(
    userCollateralTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    userUsdiTokenAccount: PublicKey,
    cometIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let cometPosition = await this.getCometPosition(cometIndex);

    return (await this.program.instruction.closeComet(
      this.managerAddress[1],
      cometIndex,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[cometPosition.poolIndex].assetInfo.iassetMint,
          userCollateralTokenAccount: userCollateralTokenAccount,
          userIassetTokenAccount: userIassetTokenAccount,
          userUsdiTokenAccount: userUsdiTokenAccount,
          cometPositions: userAccount.cometPositions,
          cometLiquidityTokenAccount:
            tokenData.pools[cometPosition.poolIndex].cometLiquidityTokenAccount,
          ammUsdiTokenAccount:
            tokenData.pools[cometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[cometPosition.poolIndex].iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[cometPosition.poolIndex].liquidityTokenMint,
          vault: tokenData.collaterals[cometPosition.collateralIndex].vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async recenterComet(
    userIassetTokenAccount: PublicKey,
    cometIndex: number,
    signers?: Array<Keypair>
  ) {
    const recenterCometIx = await this.recenterCometInstruction(
      userIassetTokenAccount,
      cometIndex
    );
    await this.provider.send(new Transaction().add(recenterCometIx), signers);
  }
  public async recenterCometInstruction(
    userIassetTokenAccount: PublicKey,
    cometIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let cometPosition = await this.getCometPosition(cometIndex);

    return (await this.program.instruction.recenterComet(
      this.managerAddress[1],
      cometIndex,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[cometPosition.poolIndex].assetInfo.iassetMint,
          userIassetTokenAccount: userIassetTokenAccount,
          cometPositions: userAccount.cometPositions,
          ammUsdiTokenAccount:
            tokenData.pools[cometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[cometPosition.poolIndex].iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[cometPosition.poolIndex].liquidityTokenMint,
          vault: tokenData.collaterals[cometPosition.collateralIndex].vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async initializeUserCometManagerPosition(
    user = this.provider.wallet.publicKey,
    signers?: Array<Keypair>
  ) {
    const recenterCometIx =
      await this.initializeUserCometManagerPositionInstruction(user);
    await this.provider.send(new Transaction().add(recenterCometIx), signers);
  }
  public async initializeUserCometManagerPositionInstruction(user: PublicKey) {
    const { userPubkey, bump } = await this.getUserAddress();

    const cometManagerAccount = anchor.web3.Keypair.generate();

    return (await this.program.instruction.initializeUserCometManagerPosition(
      this.managerAddress[1],
      {
        accounts: {
          user: user,
          admin: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          userAccount: userPubkey,
          cometManager: cometManagerAccount.publicKey,
        },
      }
    )) as TransactionInstruction;
  }

  public async initializeMultiPoolCometPosition(
    usdiAmount: BN,
    poolIndex: number,
    forManager: boolean,
    signers?: Array<Keypair>
  ) {
    const initializeCometIx =
      await this.initializeMultiPoolCometPositionInstruction(
        usdiAmount,
        poolIndex,
        forManager
      );
    await this.provider.send(new Transaction().add(initializeCometIx), signers);
  }
  public async initializeMultiPoolCometPositionInstruction(
    usdiAmount: BN,
    poolIndex: number,
    forManager: boolean
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();

    let multiPoolCometAddress = forManager
      ? userAccount.cometManager
      : userAccount.multiPoolComet;

    return (await this.program.instruction.initializeMultiPoolCometPosition(
      this.managerAddress[1],
      poolIndex,
      usdiAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint: tokenData.pools[poolIndex].assetInfo.iassetMint,
          multiPoolComet: multiPoolCometAddress,
          ammUsdiTokenAccount: tokenData.pools[poolIndex].usdiTokenAccount,
          ammIassetTokenAccount: tokenData.pools[poolIndex].iassetTokenAccount,
          liquidityTokenMint: tokenData.pools[poolIndex].liquidityTokenMint,
          cometLiquidityTokenAccount:
            tokenData.pools[poolIndex].cometLiquidityTokenAccount,
          rent: RENT_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async addCollateralToMultiPoolComet(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number,
    forManager: boolean,
    signers?: Array<Keypair>
  ) {
    const addCollateralToMultiPoolCometIx =
      await this.addCollateralToMultiPoolCometInstruction(
        userCollateralTokenAccount,
        collateralAmount,
        collateralIndex,
        forManager
      );
    await this.provider.send(
      new Transaction().add(addCollateralToMultiPoolCometIx),
      signers
    );
  }
  public async addCollateralToMultiPoolCometInstruction(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number,
    forManager: boolean
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let multiPoolCometAddress = forManager
      ? userAccount.cometManager
      : userAccount.multiPoolComet;

    return (await this.program.instruction.addCollateralToMultiPoolComet(
      this.managerAddress[1],
      collateralIndex,
      collateralAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          multiPoolComet: multiPoolCometAddress,
          vault: tokenData.collaterals[collateralIndex].vault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async withdrawCollateralFromMultiPoolComet(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number,
    forManager: boolean,
    signers?: Array<Keypair>
  ) {
    const withdrawCollateralFromMultiPoolCometIx =
      await this.withdrawCollateralFromMultiPoolCometInstruction(
        userCollateralTokenAccount,
        collateralAmount,
        collateralIndex,
        forManager
      );
    await this.provider.send(
      new Transaction().add(withdrawCollateralFromMultiPoolCometIx),
      signers
    );
  }
  public async withdrawCollateralFromMultiPoolCometInstruction(
    userCollateralTokenAccount: PublicKey,
    collateralAmount: BN,
    collateralIndex: number,
    forManager: boolean
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let multiPoolCometAddress = forManager
      ? userAccount.cometManager
      : userAccount.multiPoolComet;

    return (await this.program.instruction.withdrawCollateralFromMultiPoolComet(
      this.managerAddress[1],
      collateralIndex,
      collateralAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          multiPoolComet: multiPoolCometAddress,
          vault: tokenData.collaterals[collateralIndex].vault,
          userCollateralTokenAccount: userCollateralTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async addLiquidityToMultiPoolComet(
    usdiAmount: BN,
    cometPositionIndex: number,
    forManager: boolean,
    signers?: Array<Keypair>
  ) {
    const addLiquidityToMultiPoolCometIx =
      await this.addLiquidityToMultiPoolCometInstruction(
        usdiAmount,
        cometPositionIndex,
        forManager
      );
    await this.provider.send(
      new Transaction().add(addLiquidityToMultiPoolCometIx),
      signers
    );
  }
  public async addLiquidityToMultiPoolCometInstruction(
    usdiAmount: BN,
    cometPositionIndex: number,
    forManager: boolean
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let multiPoolCometAddress = forManager
      ? userAccount.cometManager
      : userAccount.multiPoolComet;
    let multiPoolComet = await this.getMultiPoolComet(forManager);
    let multiPoolCometPosition = await multiPoolComet.cometPositions[
      cometPositionIndex
    ];

    return (await this.program.instruction.addLiquidityToMultiPoolComet(
      this.managerAddress[1],
      cometPositionIndex,
      usdiAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[multiPoolCometPosition.poolIndex].assetInfo
              .iassetMint,
          multiPoolComet: multiPoolCometAddress,
          ammUsdiTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex]
              .iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[multiPoolCometPosition.poolIndex]
              .liquidityTokenMint,
          cometLiquidityTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex]
              .cometLiquidityTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async withdrawLiquidityFromMultiPoolComet(
    usdiAmount: BN,
    cometPositionIndex: number,
    forManager: boolean,
    signers?: Array<Keypair>
  ) {
    const withdrawLiquidityFromMultiPoolCometIx =
      await this.withdrawLiquidityFromMultiPoolCometInstruction(
        usdiAmount,
        cometPositionIndex,
        forManager
      );
    await this.provider.send(
      new Transaction().add(withdrawLiquidityFromMultiPoolCometIx),
      signers
    );
  }
  public async withdrawLiquidityFromMultiPoolCometInstruction(
    usdiAmount: BN,
    cometPositionIndex: number,
    forManager: boolean
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let multiPoolCometAddress = forManager
      ? userAccount.cometManager
      : userAccount.multiPoolComet;
    let multiPoolComet = await this.getMultiPoolComet(forManager);
    let multiPoolCometPosition =
      multiPoolComet.cometPositions[cometPositionIndex];

    return (await this.program.instruction.withdrawLiquidityFromMultiPoolComet(
      this.managerAddress[1],
      cometPositionIndex,
      usdiAmount,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[multiPoolCometPosition.poolIndex].assetInfo
              .iassetMint,
          multiPoolComet: multiPoolCometAddress,
          ammUsdiTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex]
              .iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[multiPoolCometPosition.poolIndex]
              .liquidityTokenMint,
          cometLiquidityTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex]
              .cometLiquidityTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async recenterMultiPoolComet(
    userIassetTokenAccount: PublicKey,
    cometPositionIndex: number,
    collateralIndex: number,
    forManager: boolean,
    signers?: Array<Keypair>
  ) {
    const recenterMultiPoolCometIx = await this.recenterMultiPoolCometInstruction(
      userIassetTokenAccount,
      cometPositionIndex,
      collateralIndex,
      forManager
    );
    await this.provider.send(
      new Transaction().add(recenterMultiPoolCometIx),
      signers
    );
  }
  public async recenterMultiPoolCometInstruction(
    userIassetTokenAccount: PublicKey,
    cometPositionIndex: number,
    collateralIndex: number,
    forManager: boolean
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let multiPoolCometAddress = forManager
      ? userAccount.cometManager
      : userAccount.multiPoolComet;
    let multiPoolComet = await this.getMultiPoolComet(forManager);
    let multiPoolCometPosition =
      multiPoolComet.cometPositions[cometPositionIndex];

    return (await this.program.instruction.recenterMultiPoolComet(
      this.managerAddress[1],
      cometPositionIndex,
      collateralIndex,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[multiPoolCometPosition.poolIndex].assetInfo.iassetMint,
          userIassetTokenAccount: userIassetTokenAccount,
          multiPoolComet: multiPoolCometAddress,
          ammUsdiTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex].iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[multiPoolCometPosition.poolIndex].liquidityTokenMint,
          vault: tokenData.collaterals[collateralIndex].vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async closeMultiPoolComet(
    userIassetTokenAccount: PublicKey,
    userUsdiTokenAccount: PublicKey,
    cometPositionIndex: number,
    forManager: boolean,
    signers?: Array<Keypair>
  ) {
    const closeMultiPoolCometIx = await this.closeMultiPoolCometInstruction(
      userIassetTokenAccount,
      userUsdiTokenAccount,
      cometPositionIndex,
      forManager
    );
    await this.provider.send(
      new Transaction().add(closeMultiPoolCometIx),
      signers
    );
  }
  public async closeMultiPoolCometInstruction(
    userIassetTokenAccount: PublicKey,
    userUsdiTokenAccount: PublicKey,
    cometPositionIndex: number,
    forManager: boolean
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount();
    let multiPoolCometAddress = forManager
      ? userAccount.cometManager
      : userAccount.multiPoolComet;
    let multiPoolComet = await this.getMultiPoolComet(forManager);
    let multiPoolCometPosition =
      multiPoolComet.cometPositions[cometPositionIndex];

    return (await this.program.instruction.closeMultiPoolComet(
      this.managerAddress[1],
      cometPositionIndex,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint:
            tokenData.pools[multiPoolCometPosition.poolIndex].assetInfo.iassetMint,
          userIassetTokenAccount: userIassetTokenAccount,
          userUsdiTokenAccount: userUsdiTokenAccount,
          multiPoolComet: multiPoolCometAddress,
          cometLiquidityTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex].cometLiquidityTokenAccount,
          ammUsdiTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex].usdiTokenAccount,
          ammIassetTokenAccount:
            tokenData.pools[multiPoolCometPosition.poolIndex].iassetTokenAccount,
          liquidityTokenMint:
            tokenData.pools[multiPoolCometPosition.poolIndex].liquidityTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  // Hackathon ONLY!
  public async hackathonMintUsdiInstruction(
    userUsdiTokenAccount: PublicKey,
    amount: number
  ) {
    return this.program.instruction.mintUsdiHackathon(
      this.managerAddress[1],
      new BN(amount),
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          userUsdiTokenAccount: userUsdiTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
  }

  public async getOrCreateUsdiAssociatedTokenAccount() {
    return await this.getOrCreateAssociatedTokenAccount(this.manager.usdiMint);
  }

  public async getOrCreateAssociatedTokenAccount(mint: PublicKey) {
    const associatedToken = await getAssociatedTokenAddress(
      mint,
      this.provider.wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    let account;
    try {
      account = await getAccount(
        this.connection,
        associatedToken,
        "recent",
        TOKEN_PROGRAM_ID
      );
    } catch (error: unknown) {
      if (error instanceof TokenAccountNotFoundError) {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            this.provider.wallet.publicKey,
            associatedToken,
            this.provider.wallet.publicKey,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        await this.provider.send(transaction);
        await sleep(200);
        account = await getAccount(
          this.connection,
          associatedToken,
          "recent",
          TOKEN_PROGRAM_ID
        );
      } else {
        throw error;
      }
    }

    if (!account) {
      throw Error("Could not create account!");
    }
    return account;
  }

  public async hackathonMintUsdi(
    userUsdiTokenAccount: PublicKey,
    amount: number
  ) {
    const mintUsdiTx = await this.hackathonMintUsdiInstruction(
      userUsdiTokenAccount,
      amount
    );
    await this.provider.send(new Transaction().add(mintUsdiTx));
  }

  public async liquidateComet(liquidateAccount: PublicKey, cometIndex: number) {
    const updatePricesIx = await this.updatePricesInstruction();
    const liquidateCometTx = await this.liquidateCometInstruction(
      liquidateAccount,
      cometIndex
    );
    await this.provider.send(
      new Transaction().add(updatePricesIx).add(liquidateCometTx)
    );
  }
  public async liquidateCometInstruction(
    liquidateAccount: PublicKey,
    cometIndex: number
  ) {
    const { userPubkey, bump } = await this.getUserAddress();
    const userAccount = await this.getUserAccount(liquidateAccount);
    const tokenData = await this.getTokenData();

    const cometPosition = await this.getCometPosition(cometIndex);
    const pool = tokenData.pools[cometPosition.poolIndex];
    const collateral = tokenData.collaterals[cometPosition.collateralIndex];

    const liquidatorCollateralTokenAccount =
      await this.getOrCreateAssociatedTokenAccount(collateral.mint);

    const liquidatorUsdiTokenAccount =
      await this.getOrCreateAssociatedTokenAccount(this.manager.usdiMint);

    const liquidatoriAssetTokenAccount =
      await this.getOrCreateAssociatedTokenAccount(pool.assetInfo.iassetMint);

    return this.program.instruction.liquidateComet(
      this.managerAddress[1],
      bump,
      cometIndex,
      {
        accounts: {
          liquidator: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          userAccount: liquidateAccount,
          usdiMint: this.manager.usdiMint,
          iassetMint: pool.assetInfo.iassetMint,
          cometPositions: userAccount.cometPositions,
          vault: tokenData.collaterals[cometPosition.collateralIndex].vault,
          cometLiquidityTokenAccount: pool.cometLiquidityTokenAccount,
          liquidatedCometUsdiTokenAccount: this.manager.liquidatedCometUsdi,
          liquidationIassetTokenAccount: pool.liquidationIassetTokenAccount,
          liquidatedCometUsdi: this.manager.liquidatedCometUsdi,
          ammUsdiTokenAccount: pool.usdiTokenAccount,
          ammIassetTokenAccount: pool.iassetTokenAccount,
          liquidatorCollateralTokenAccount:
            liquidatorCollateralTokenAccount.address,
          liquidatorUsdiTokenAccount: liquidatorUsdiTokenAccount.address,
          liquidatorIassetTokenAccount: liquidatoriAssetTokenAccount.address,
          liquidityTokenMint: pool.liquidityTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
  }

  public async claimLiquidatedComet(cometIndex: number) {
    const claimLiquidatedCometTx = await this.claimLiquidatedCometInstruction(
      cometIndex
    );
    await this.provider.send(new Transaction().add(claimLiquidatedCometTx));
  }

  public async claimLiquidatedCometInstruction(cometIndex: number) {
    const { userPubkey, bump } = await this.getUserAddress();
    const userAccount = await this.getUserAccount();
    const tokenData = await this.getTokenData();

    const cometPosition = await this.getCometPosition(cometIndex);
    const pool = tokenData.pools[cometPosition.poolIndex];

    const userUsdiTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      this.manager.usdiMint
    );
    const useriAssetTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      pool.assetInfo.iassetMint
    );

    return this.program.instruction.claimLiquidatedComet(
      this.managerAddress[1],
      bump,
      cometIndex,
      {
        accounts: {
          user: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          userAccount: userPubkey,
          cometPositions: userAccount.cometPositions,
          userIassetTokenAccount: useriAssetTokenAccount.address,
          liquidatedCometUsdi: this.manager.liquidatedCometUsdi,
          userUsdiTokenAccount: userUsdiTokenAccount.address,
          liquidationIassetTokenAccount: pool.liquidationIassetTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
  }

  public async liquidateMintPosition(
    liquidateAccount: PublicKey,
    mintIndex: number
  ) {
    const updatePricesIx = await this.updatePricesInstruction();
    const liquidateMintTx = await this.liquidateMintPositionInstruction(
      liquidateAccount,
      mintIndex
    );
    await this.provider.send(
      new Transaction().add(updatePricesIx).add(liquidateMintTx)
    );
  }

  public async liquidateMintPositionInstruction(
    liquidateAccount: PublicKey,
    mintIndex: number
  ) {
    const userAccount = await this.getUserAccount(liquidateAccount);
    const tokenData = await this.getTokenData();

    const mintPosition = await this.getMintPosition(mintIndex);
    const pool = tokenData.pools[mintPosition.poolIndex];
    const collateral = tokenData.collaterals[mintPosition.collateralIndex];

    const liquidatorCollateralTokenAccount =
      await this.getOrCreateAssociatedTokenAccount(collateral.mint);
    const liquidatoriAssetTokenAccount =
      await this.getOrCreateAssociatedTokenAccount(pool.assetInfo.iassetMint);

    return this.program.instruction.liquidateMintPosition(
      this.managerAddress[1],
      mintIndex,
      {
        accounts: {
          liquidator: this.provider.wallet.publicKey,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          userAccount: liquidateAccount,
          iassetMint: pool.assetInfo.iassetMint,
          mintPositions: userAccount.mintPositions,
          vault: collateral.vault,
          ammUsdiTokenAccount: pool.usdiTokenAccount,
          ammIassetTokenAccount: pool.iassetTokenAccount,
          liquidatorCollateralTokenAccount:
            liquidatorCollateralTokenAccount.address,
          liquidatorIassetTokenAccount: liquidatoriAssetTokenAccount.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );
  }

  public async partialCometLiquidation(
    liquidateAccount: PublicKey,
    liquidateiAssetTokenAccount: PublicKey,
    cometIndex: number
  ) {
    let partialLiquidationTx = await this.partialCometLiquidationInstruction(
      liquidateAccount,
      liquidateiAssetTokenAccount,
      cometIndex
    );
    await this.provider.send(new Transaction().add(partialLiquidationTx));
  }

  public async partialCometLiquidationInstruction(
    liquidateAccount: PublicKey,
    liquidateiAssetTokenAccount: PublicKey,
    cometIndex: number
  ) {
    let tokenData = await this.getTokenData();
    let userAccount = await this.getUserAccount(liquidateAccount);
    let cometPositions = await this.getCometPositions(liquidateAccount);
    let cometPosition = cometPositions.cometPositions[cometIndex];
    let pool = tokenData.pools[cometPosition.poolIndex];

    let liquidatorIassetTokenAccount =
      await this.getOrCreateAssociatedTokenAccount(pool.assetInfo.iassetMint);

    return (await this.program.instruction.partialCometLiquidation(
      this.managerAddress[1],
      cometIndex,
      {
        accounts: {
          liquidator: this.provider.wallet.publicKey,
          userAccount: liquidateAccount,
          manager: this.managerAddress[0],
          tokenData: this.manager.tokenData,
          usdiMint: this.manager.usdiMint,
          iassetMint: pool.assetInfo.iassetMint,
          userIassetTokenAccount: liquidateiAssetTokenAccount,
          liquidatorIassetTokenAccount: liquidatorIassetTokenAccount.address,
          cometPositions: userAccount.cometPositions,
          ammUsdiTokenAccount: pool.usdiTokenAccount,
          ammIassetTokenAccount: pool.iassetTokenAccount,
          liquidityTokenMint: pool.liquidityTokenMint,
          vault: tokenData.collaterals[cometPosition.collateralIndex].vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    )) as TransactionInstruction;
  }

  public async getUsdiBalance() {
    let associatedTokenAccount =
      await this.getOrCreateUsdiAssociatedTokenAccount();

    return Number(associatedTokenAccount.amount) / 100000000;
  }

  public async getiAssetBalance(index: number) {
    let associatedTokenAccount = await this.getOrCreateAssociatedTokenAccount(
      (
        await this.getPool(index)
      ).assetInfo.iassetMint
    );

    return Number(associatedTokenAccount.amount) / 100000000;
  }

	public async getiAssetInfo(walletAddress?: PublicKey) {
		const mints = await this.getiAssetMints()
		const iassetInfo = []
		let i = 0
		for (var mint of mints) {
			let poolBalances = await this.getPoolBalances(i)
			let price = poolBalances[1] / poolBalances[0]
			iassetInfo.push([i, price])
			i++
		}
		return iassetInfo
	}

  public async getiAssetMints() {
    const tokenData = await this.getTokenData();
    let mints: PublicKey[] = [];
    let index = 0;
    for (const pool of tokenData.pools) {
      if (index === Number(tokenData.numPools)) {
        break;
      }
      mints.push(pool.assetInfo.iassetMint);
      index++;
    }
    return mints;
  }

  public async getMintiAssetData(index: number) {
    let assetInfo = await this.getAssetInfo(index);
    let associatedTokenAddress = (
      await this.getOrCreateAssociatedTokenAccount(assetInfo.iassetMint)
    ).address;
    let amount = (
      await this.connection.getTokenAccountBalance(
        associatedTokenAddress,
        "confirmed"
      )
    ).value!.uiAmount;
    return [
      toScaledNumber(assetInfo.price),
      Number(assetInfo.stableCollateralRatio.val),
      Number(assetInfo.cryptoCollateralRatio.val),
      amount,
    ];
  }

  public async getUseriAssetInfo() {
    const mints = await this.getiAssetMints();
    const userInfo = [];
    let i = 0;
    for (var mint of mints) {
      let associatedTokenAddress = (
        await PublicKey.findProgramAddress(
          [
            this.provider.wallet.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
          ],
          SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        )
      )[0];
      let amount;
      try {
        amount = (
          await this.connection.getTokenAccountBalance(
            associatedTokenAddress,
            "confirmed"
          )
        ).value!.uiAmount;
      } catch {
        amount = 0;
      }

      if (amount !== null && amount > 0) {
        let poolBalances = await this.getPoolBalances(i);
        let price = poolBalances[1] / poolBalances[0];
        userInfo.push([i, price, amount]);
      }
      i++;
    }
    return userInfo;
  }

  public async getUserMintInfos() {
    const mintPositions = await this.getMintPositions();
    const mintInfos = [];
    for (let i = 0; i < Number(mintPositions.numPositions); i++) {
      let mintPosition = mintPositions.mintPositions[i];
      let poolIndex = mintPosition.poolIndex;
      let collateralIndex = mintPosition.collateralIndex;
      let assetInfo = await this.getAssetInfo(poolIndex);
      let collateral = await this.getCollateral(collateralIndex);
      let collateralAmount = mintPosition.collateralAmount;
      let price = assetInfo.price;
      let borrowedIasset = mintPosition.borrowedIasset;
      let collateralRatio: Value;
      let minCollateralRatio: Value;
      if (collateral.stable) {
        collateralRatio = div(collateralAmount, mul(price, borrowedIasset));
        minCollateralRatio = assetInfo.stableCollateralRatio;
      } else {
        let collateralAssetInfo = await this.getAssetInfo(collateral.poolIndex);
        let collateralPrice = collateralAssetInfo.price;
        let collateralAmount = mintPosition.collateralAmount;
        collateralRatio = div(
          mul(collateralPrice, collateralAmount),
          mul(price, borrowedIasset)
        );
        minCollateralRatio = assetInfo.cryptoCollateralRatio;
      }
      mintInfos.push([
        poolIndex,
        collateralIndex,
        toScaledNumber(price),
        toScaledNumber(borrowedIasset),
        toScaledNumber(collateralAmount),
        toScaledPercent(collateralRatio),
        toScaledPercent(minCollateralRatio),
      ]);
    }
    return mintInfos;
  }

  public async getUserMintInfo(index: number) {
    const mintPositions = await this.getMintPositions();
    let mintPosition = mintPositions.mintPositions[index];
    let poolIndex = mintPosition.poolIndex;
    let collateralIndex = mintPosition.collateralIndex;
    let assetInfo = await this.getAssetInfo(poolIndex);
    let collateral = await this.getCollateral(collateralIndex);
    let collateralAmount = mintPosition.collateralAmount;
    let price = assetInfo.price;
    let borrowedIasset = mintPosition.borrowedIasset;
    let collateralRatio: Value;
    let minCollateralRatio: Value;
    if (collateral.stable) {
      collateralRatio = div(collateralAmount, mul(price, borrowedIasset));
      minCollateralRatio = assetInfo.stableCollateralRatio;
    } else {
      let collateralAssetInfo = await this.getAssetInfo(collateral.poolIndex);
      let collateralPrice = collateralAssetInfo.price;
      let collateralAmount = mintPosition.collateralAmount;
      collateralRatio = div(
        mul(collateralPrice, collateralAmount),
        mul(price, borrowedIasset)
      );
      minCollateralRatio = assetInfo.cryptoCollateralRatio;
    }
    return [
      toScaledNumber(borrowedIasset),
      toScaledNumber(collateralAmount),
      toScaledPercent(collateralRatio),
      toScaledPercent(minCollateralRatio),
    ];
  }

  public async getUserLiquidityInfos() {
    const liquidityPositions = await this.getLiquidityPositions();
    const liquidityInfos = [];
    for (let i = 0; i < Number(liquidityPositions.numPositions); i++) {
      let liquidityPosition = liquidityPositions.liquidityPositions[i];
      let poolIndex = liquidityPosition.poolIndex;
      let pool = await this.getPool(poolIndex);
      let poolBalances = await this.getPoolBalances(poolIndex);
      let price = poolBalances[1] / poolBalances[0];
      let liquidityTokenAmount = toScaledNumber(
        liquidityPosition.liquidityTokenValue
      );
      // @ts-ignore
      let liquidityTokenSupply = (
        await this.connection.getTokenSupply(pool.liquidityTokenMint)
      ).value!.uiAmount;
      if (liquidityTokenSupply === null) {
        throw new Error("Couldn't get token supply");
      }
      let iassetValue =
        (poolBalances[0] * liquidityTokenAmount) / liquidityTokenSupply;
      let usdiValue =
        (poolBalances[1] * liquidityTokenAmount) / liquidityTokenSupply;
      liquidityInfos.push([
        poolIndex,
        price,
        iassetValue,
        usdiValue,
        liquidityTokenAmount,
      ]);
    }
    return liquidityInfos;
  }

  public async getUserCometInfos() {
    const cometPositions = await this.getCometPositions();
    const cometInfos = [];
    for (let i = 0; i < Number(cometPositions.numPositions); i++) {
      let cometPosition = cometPositions.cometPositions[i];
      let poolIndex = cometPosition.poolIndex;
      let pool = await this.getPool(poolIndex);
      let collateralIndex = cometPosition.collateralIndex;
      let assetInfo = await this.getAssetInfo(poolIndex);
      let lowerPriceRange = toScaledNumber(cometPosition.lowerPriceRange);
      let upperPriceRange = toScaledNumber(cometPosition.upperPriceRange);
      let oraclePrice = toScaledNumber(assetInfo.price);
      let poolBalances = await this.getPoolBalances(poolIndex);
      let ammPrice = poolBalances[1] / poolBalances[0];
      let minGap = Math.min(
        oraclePrice - lowerPriceRange,
        ammPrice - lowerPriceRange,
        upperPriceRange - oraclePrice,
        upperPriceRange - ammPrice
      );
      let indicatorPrice: number;
      switch (minGap) {
        case oraclePrice - lowerPriceRange:
          indicatorPrice = oraclePrice;
          break;
        case ammPrice - lowerPriceRange:
          indicatorPrice = ammPrice;
          break;
        case upperPriceRange - oraclePrice:
          indicatorPrice = oraclePrice;
          break;
        case upperPriceRange - ammPrice:
          indicatorPrice = ammPrice;
          break;
        default:
          throw new Error("Not supported");
      }
      let centerPrice = div(
        cometPosition.borrowedUsdi,
        cometPosition.borrowedIasset
      );
      let liquidityTokenAmount = toScaledNumber(
        cometPosition.liquidityTokenValue
      );
      // @ts-ignore
      let liquidityTokenSupply = (
        await this.connection.getTokenSupply(pool.liquidityTokenMint)
      ).value!.uiAmount;
      if (liquidityTokenSupply === null) {
        throw new Error("Couldn't get token supply");
      }
      let iassetValue =
        (poolBalances[0] * liquidityTokenAmount) / liquidityTokenSupply;
      let usdiValue =
        (poolBalances[0] * liquidityTokenAmount) / liquidityTokenSupply;
      let borrowedIasset = toScaledNumber(cometPosition.borrowedIasset);
      let borrowedUsdi = toScaledNumber(cometPosition.borrowedIasset);
      let ildIsIasset: boolean;
      let ild: number;
      if (borrowedIasset > iassetValue) {
        ildIsIasset = true;
        ild = borrowedIasset - iassetValue;
      } else if (borrowedUsdi > usdiValue) {
        ildIsIasset = false;
        ild = borrowedUsdi - usdiValue;
      } else {
        ildIsIasset = false;
        ild = 0;
      }
      cometInfos.push([
        poolIndex,
        collateralIndex,
        indicatorPrice,
        toScaledNumber(centerPrice),
        lowerPriceRange,
        upperPriceRange,
        toScaledNumber(cometPosition.collateralAmount),
        ildIsIasset,
        ild,
        borrowedIasset,
        borrowedUsdi,
        liquidityTokenAmount,
      ]);
    }
    return cometInfos;
  }

  public async getiAssetInfos() {
    const iassetInfo = [];
    for (let i = 0; i < Number((await this.getTokenData()).numPools); i++) {
      let poolBalances = await this.getPoolBalances(i);
      let price = poolBalances[1] / poolBalances[0];
      let liquidity = poolBalances[1] * 2;
      iassetInfo.push([i, price, liquidity]);
    }
    return iassetInfo;
  }

  public async initializeMintPosition(
    iassetAmount: BN,
    collateralAmount: BN,
    userCollateralTokenAccount: PublicKey,
    userIassetTokenAccount: PublicKey,
    poolIndex: number,
    collateralIndex: number,
    signers: Array<Keypair>
  ) {
    const updatePricesIx = await this.updatePricesInstruction();
    const initializeMintPositionsIx =
      await this.initializeMintPositionsInstruction(
        userCollateralTokenAccount,
        userIassetTokenAccount,
        iassetAmount,
        collateralAmount,
        poolIndex,
        collateralIndex
      );
    await this.provider.send(
      new Transaction().add(updatePricesIx).add(initializeMintPositionsIx),
      signers
    );
  }

  public async calculateMaxUSDiAmountFromCollateral(
    collateralIndex: number,
    poolIndex: number,
    collateralAmount: number
  ) {
    // Coming soon
  }

  public async calculateRangeFromUSDiAndCollateral(
    collateralIndex: number,
    poolIndex: number,
    collateralAmount: number,
    usdiAmount: number
  ) {
    let collateral = await this.getCollateral(collateralIndex);
    let pool = await this.getPool(poolIndex);
    let balances = await this.getPoolBalances(poolIndex);
    if (collateral.stable) {
      let liquidityTokenSupplyBeforeComet = (
        await this.connection.getTokenSupply(
          pool.liquidityTokenMint,
          "confirmed"
        )
      ).value!.uiAmount;
      if (liquidityTokenSupplyBeforeComet === null) {
        throw new Error("Couldn't get token supply");
      }
      let cometLiquidityTokenAmount =
        (usdiAmount * liquidityTokenSupplyBeforeComet) / balances[1];
      let updatedliquidityTokenSupply =
        liquidityTokenSupplyBeforeComet + cometLiquidityTokenAmount;
      let yUnder =
        ((usdiAmount - collateralAmount) * updatedliquidityTokenSupply) /
        cometLiquidityTokenAmount;
      let iassetAmount = usdiAmount / (balances[1] / balances[0]);
      let invariant = (balances[1] + usdiAmount) * (balances[0] + iassetAmount);
      let xUnder = invariant / yUnder;
      let pLower = (yUnder / xUnder) * 2;

      let a = collateralAmount / invariant;
      let b = cometLiquidityTokenAmount / updatedliquidityTokenSupply;
      let c = iassetAmount;
      let xUpper = (Math.sqrt(b ** 2 + 4 * a * c) - b) / (2 * a);
      let yUpper = invariant / xUpper;
      let pUpper = ((yUpper / xUpper) * 2) / 3;

      return [pLower, pUpper];
    } else {
      //coming soon...
      return;
    }
  }

  public async calculateUSDiAmountAndUpperRangeFromLowerRange(
    collateralIndex: number,
    poolIndex: number,
    collateralAmount: number,
    lowerRange: number
  ) {
    // Coming soon
  }
}

export interface Manager {
  usdiMint: PublicKey;
  liquidatedCometUsdi: PublicKey;
  tokenData: PublicKey;
  admin: PublicKey;
}

export interface User {
  isManager: number;
  authority: PublicKey;
  cometPositions: PublicKey;
  mintPositions: PublicKey;
  liquidityPositions: PublicKey;
  multiPoolComet: PublicKey;
  cometManager: PublicKey;
}

export interface TokenData {
  manager: PublicKey;
  numPools: BN;
  numCollaterals: BN;
  pools: Array<Pool>;
  collaterals: Array<Collateral>;
  chainlinkProgram: PublicKey;
}

export interface LiquidityPositions {
  owner: PublicKey;
  numPositions: BN;
  liquidityPositions: Array<LiquidityPosition>;
}

export interface LiquidityPosition {
  authority: PublicKey;
  liquidityTokenValue: Value;
  poolIndex: number;
}

export interface MintPositions {
  owner: PublicKey;
  numPositions: BN;
  mintPositions: Array<MintPosition>;
}

export interface MintPosition {
  authority: PublicKey;
  collateralAmount: Value;
  poolIndex: number;
  collateralIndex: number;
  borrowedIasset: Value;
}

export interface CometPositions {
  owner: PublicKey;
  numPositions: BN;
  cometPositions: Array<CometPosition>;
}

export interface CometPosition {
  authority: PublicKey;
  collateralAmount: Value;
  poolIndex: number;
  collateralIndex: number;
  borrowedUsdi: Value;
  borrowedIasset: Value;
  liquidityTokenValue: Value;
  lowerPriceRange: Value;
  upperPriceRange: Value;
  cometLiquidation: CometLiquidation;
}

export interface LiquidationStatus {
  healthy: object,
  partially: object,
  fully: object,
}

export interface CometLiquidation {
  status: LiquidationStatus;
  excess_token_type_is_usdi: number;
  excess_token_amount: Value;
}

export interface MultiPoolComet {
  owner: PublicKey;
  numPositions: BN;
  numCollaterals: BN;
  totalCollateralAmount: Value;
  cometPositions: Array<MultiPoolCometPosition>;
  collaterals: Array<MultiPoolCometCollateral>;
}

export interface MultiPoolCometPosition {
  authority: PublicKey;
  poolIndex: number;
  borrowedUsdi: Value;
  borrowedIasset: Value;
  liquidityTokenValue: Value;
  cometLiquidation: CometLiquidation;
}

export interface MultiPoolCometCollateral {
  authority: PublicKey;
  collateralAmount: Value;
  collateralIndex: number;
}

export interface Value {
  val: BN;
  scale: number;
}

export interface AssetInfo {
  iassetMint: PublicKey;
  priceFeedAddresses: Array<PublicKey>;
  price: Value;
  twap: Value;
  confidence: Value;
  status: number;
  lastUpdate: number;
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
  stable: number;
}
