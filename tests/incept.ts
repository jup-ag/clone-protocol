import * as anchor from "@project-serum/anchor";
import { Program, BN } from "@project-serum/anchor";
import { Incept } from "../sdk/src/idl/incept";
import { Pyth } from "../sdk/src/idl/pyth";
import { MockUsdc } from "../sdk/src/idl/mock_usdc";
import { Store } from "../sdk/src/idl/store";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import {
  Incept as InceptConnection,
  TokenData,
  User,
  Comet,
  MintPositions,
  LiquidityPositions,
  Manager,
  Pool,
  DEVNET_TOKEN_SCALE,
  toDevnetScale,
} from "../sdk/src/incept";
import {
  createPriceFeed,
  setPrice,
  getFeedData,
  ChainLinkOracle,
} from "../sdk/src/oracle";
import { sleep, signAndSend, toScaledNumber } from "../sdk/src/utils";

const RENT_PUBKEY = anchor.web3.SYSVAR_RENT_PUBKEY;
const SYSTEM_PROGRAM_ID = anchor.web3.SystemProgram.programId;

describe("incept", async () => {
  const provider = anchor.Provider.local();
  anchor.setProvider(provider);

  let inceptProgram = anchor.workspace.Incept as Program<Incept>;
  let pythProgram = anchor.workspace.Pyth as Program<Pyth>;
  let mockUSDCProgram = anchor.workspace.MockUsdc as Program<MockUsdc>;
  let walletPubkey = inceptProgram.provider.wallet.publicKey;
  let storeProgram = anchor.workspace.Store as Program<Store>;

  let chainlink; //= new ChainLinkOracle(storeProgram);

  const mockUSDCMint = anchor.web3.Keypair.generate();
  const mockUSDCAccount = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("mock_usdc")],
    mockUSDCProgram.programId
  );

  const healthScoreCoefficient = 1.059;
  const ilHealthScoreCoefficient = 128.288;
  const ilHealthScoreCutoff = 100;
  const ilLiquidationRewardPct = 5;

  let priceFeed;
  let mockUSDCTokenAccountInfo;
  let usdiTokenAccountInfo;
  let iassetTokenAccountInfo;
  let liquidityTokenAccountInfo;

  let inceptClient = new InceptConnection(
    inceptProgram.programId,
    provider
  ) as InceptConnection;

  it("mock usdc initialized!", async () => {
    await mockUSDCProgram.rpc.initialize(mockUSDCAccount[1], {
      accounts: {
        admin: walletPubkey,
        mockUsdcMint: mockUSDCMint.publicKey,
        mockUsdcAccount: mockUSDCAccount[0],
        rent: RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      },
      signers: [mockUSDCMint],
    });
  });

  it("manager initialized!", async () => {
    await inceptClient.initializeManager(
      storeProgram.programId,
      ilHealthScoreCoefficient,
      ilHealthScoreCutoff,
      ilLiquidationRewardPct
    );
  });

  it("user initialized!", async () => {
    await inceptClient.initializeUser();

    let userAccountData = await inceptClient.getUserAccount();

    assert(
      !userAccountData.authority.equals(anchor.web3.PublicKey.default),
      "check authority address"
    );
    assert(
      userAccountData.singlePoolComets.equals(anchor.web3.PublicKey.default),
      "check single pool comets address"
    );
    assert(
      userAccountData.mintPositions.equals(anchor.web3.PublicKey.default),
      "check mint position address"
    );
    assert(
      userAccountData.liquidityPositions.equals(anchor.web3.PublicKey.default),
      "check liquidity position address"
    );
    assert(
      userAccountData.comet.equals(anchor.web3.PublicKey.default),
      "check comet address"
    );
  });

  it("change feed price", async () => {
    let price = 10;
    const expo = -7;
    const conf = new BN((price / 10) * 10 ** -expo);

    priceFeed = await createPriceFeed(pythProgram, price, expo, conf);
    let currentPrice = (await getFeedData(pythProgram, priceFeed)).aggregate
      .price;
    assert.equal(currentPrice, price, "check initial price");

    price = 5;
    await setPrice(pythProgram, price, priceFeed);
    let updatedPrice = (await getFeedData(pythProgram, priceFeed)).aggregate
      .price;
    assert.equal(updatedPrice, price, "check updated price");

    chainlink = new ChainLinkOracle(storeProgram);

    await chainlink.createChainlinkFeed(1, 2);

    await chainlink.submitAnswer(new BN(1649943158), new BN(500000000));

    await sleep(200);

    // let r = await chainlink.fetchAnswer();

    // console.log(r);
  });

  it("mock usdc added as a collateral!", async () => {
    await inceptClient.addCollateral(
      walletPubkey,
      7,
      1,
      mockUSDCMint.publicKey
    );
    await sleep(200);
  });

  it("usdi added as a collateral!", async () => {
    await inceptClient.addCollateral(
      walletPubkey,
      8,
      1,
      inceptClient.manager.usdiMint
    );
    await sleep(200);
  });

  it("pool initialized!", async () => {
    await inceptClient.initializePool(
      walletPubkey,
      150,
      200,
      0,
      priceFeed,
      chainlink.priceFeedPubkey(),
      healthScoreCoefficient
    );
  });

  it("token data initialization check", async () => {
    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;

    assert(
      tokenData.manager.equals(inceptClient.managerAddress[0]),
      "wrong manager!"
    );
    assert(tokenData.numPools.eq(new BN(1)), "num pools incorrect");
    assert(tokenData.numCollaterals.eq(new BN(2)), "num collaterals incorrect");

    const first_pool = tokenData.pools[0];
    assert(
      !first_pool.iassetTokenAccount.equals(anchor.web3.PublicKey.default),
      "check iassetTokenAccount"
    );
    assert(
      !first_pool.usdiTokenAccount.equals(anchor.web3.PublicKey.default),
      "check iassetTokenAccount"
    );
    assert(
      !first_pool.liquidityTokenMint.equals(anchor.web3.PublicKey.default),
      "check iassetTokenAccount"
    );
    assert(
      !first_pool.liquidationIassetTokenAccount.equals(
        anchor.web3.PublicKey.default
      ),
      "check iassetTokenAccount"
    );
    assert(
      !first_pool.cometLiquidityTokenAccount.equals(
        anchor.web3.PublicKey.default
      ),
      "check iassetTokenAccount"
    );

    const assetInfo = first_pool.assetInfo;

    var valueToDecimal = function (value): Number {
      return Number(value.val) * 10 ** -Number(value.scale);
    };

    assert(
      assetInfo.priceFeedAddresses[0].equals(priceFeed),
      "check price feed"
    );

    assert.equal(
      valueToDecimal(assetInfo.stableCollateralRatio),
      1.5,
      "stable collateral ratio incorrect"
    );
    assert.equal(
      valueToDecimal(assetInfo.cryptoCollateralRatio),
      2,
      "crypto collateral ratio incorrect"
    );

    const first_collateral = tokenData.collaterals[0];
    assert(
      !first_collateral.mint.equals(anchor.web3.PublicKey.default),
      "check mint address"
    );
    assert(!first_collateral.vault.equals(anchor.web3.PublicKey.default)),
      "check vault address";
  });

  it("price updated!", async () => {
    // @ts-ignore
    let signers: Array<Signer> = [provider.wallet.payer];
    await inceptClient.updatePrices(signers);
    await sleep(200);
  });

  it("mock usdc minted!", async () => {
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    for (let i = 0; i < 1; i++) {
      await mockUSDCProgram.rpc.mintMockUsdc(mockUSDCAccount[1], {
        accounts: {
          mockUsdcMint: mockUSDCMint.publicKey,
          mockUsdcTokenAccount: mockUSDCTokenAccountInfo.address,
          mockUsdcAccount: mockUSDCAccount[0],
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [],
      });
    }
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      1000000000000,
      "check USDC amount"
    );
  });

  it("usdi minted!", async () => {
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    // @ts-ignore
    let signers: Array<Signer> = [provider.wallet.payer];

    await inceptClient.mintUsdi(
      new BN(100000000000000),
      usdiTokenAccountInfo.address,
      mockUSDCTokenAccountInfo.address,
      0,
      signers
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      1000000,
      "check iasset token amount"
    );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999999000000,
      "check USDC amount"
    );

    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;

    const vault = await inceptClient.connection.getTokenAccountBalance(
      tokenData.collaterals[0].vault,
      "confirmed"
    );
    assert.equal(vault.value!.uiAmount, 1000000, "check usdc vault amount");
  });

  it("iasset minted!", async () => {
    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;
    const pool = tokenData.pools[0];

    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    // @ts-ignore
    let signers: Array<Signer> = [provider.wallet.payer];

    await inceptClient.initializeMintPosition(
      new BN(20000000000000),
      new BN(200000000000000),
      mockUSDCTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      0,
      0,
      signers
    );

    await sleep(200);

    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      200000,
      "check iasset token amount"
    );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999979000000,
      "check USDC amount"
    );

    let vault = await inceptClient.connection.getTokenAccountBalance(
      tokenData.collaterals[0].vault,
      "confirmed"
    );
    assert.equal(vault.value!.uiAmount, 21000000, "check usdc vault amount");
  });

  it("full withdraw and close mint position!", async () => {
    // @ts-ignore
    let signers: Array<Signer> = [provider.wallet.payer];
    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;
    const pool = tokenData.pools[0];

    await inceptClient.closeMintPosition(
      iassetTokenAccountInfo.address,
      0,
      mockUSDCTokenAccountInfo.address,
      signers
    );

    await sleep(200);

    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 1000000000000,
      0,
      "check iasset token amount"
    );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999999000000,
      "check USDC amount"
    );

    const vault = await inceptClient.connection.getTokenAccountBalance(
      tokenData.collaterals[0].vault,
      "confirmed"
    );

    assert.equal(vault.value!.uiAmount, 1000000, "check usdc vault amount");

    // Recreate original position.
    await inceptClient.initializeMintPosition(
      new BN(20000000000000),
      new BN(200000000000000),
      mockUSDCTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      0,
      0,
      signers
    );
  });

  it("mint collateral added!", async () => {
    // @ts-ignore
    let signers: Array<Signer> = [provider.wallet.payer];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    await inceptClient.addCollateralToMint(
      mockUSDCTokenAccountInfo.address,
      new BN(1000000000),
      0,
      signers
    );

    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;
    const pool = tokenData.pools[0];

    await sleep(200);

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      200000,
      "check iasset token amount"
    );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999978999900,
      "check USDC amount"
    );

    const vault = await inceptClient.connection.getTokenAccountBalance(
      tokenData.collaterals[0].vault,
      "confirmed"
    );
    assert.equal(vault.value!.uiAmount, 21000100, "check usdc vault amount");
  });

  it("mint collateral removed!", async () => {
    // @ts-ignore
    let signers: Array<Signer> = [provider.wallet.payer];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    await inceptClient.withdrawCollateralFromMint(
      mockUSDCTokenAccountInfo.address,
      new BN(1000000000),
      0,
      signers
    );

    await sleep(200);
    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;

    const pool = tokenData.pools[0];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      200000,
      "check iasset token amount"
    );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999979000000,
      "check USDC amount"
    );

    const vault = await inceptClient.connection.getTokenAccountBalance(
      tokenData.collaterals[0].vault,
      "confirmed"
    );
    assert.equal(vault.value!.uiAmount, 21000000, "check usdc vault amount");
  });

  it("iasset burned!", async () => {
    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;

    const pool = tokenData.pools[0];
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    let userAccountData = await inceptClient.getUserAccount();
    let assetInfo = await inceptClient.getAssetInfo(0);

    await inceptProgram.rpc.payBackMint(
      inceptClient.managerAddress[1],
      new BN(0),
      new BN(5000000),
      {
        accounts: {
          user: walletPubkey,
          manager: inceptClient.managerAddress[0],
          tokenData: inceptClient.manager.tokenData,
          userIassetTokenAccount: iassetTokenAccountInfo.address,
          mintPositions: userAccountData.mintPositions,
          iassetMint: assetInfo.iassetMint,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );

    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      199999.95,
      "check user iasset balance."
    );
  });

  it("iasset reminted!", async () => {
    const tokenData = (await inceptProgram.account.tokenData.fetch(
      inceptClient.manager.tokenData
    )) as TokenData;

    const pool = tokenData.pools[0];
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.addiAssetToMint(
      iassetTokenAccountInfo.address,
      new BN(5000000),
      0,
      []
    );

    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      200000,
      "check user iasset balance"
    );
  });

  it("liquidity position initialized!", async () => {
    const tokenData = await inceptClient.getTokenData();

    const pool = tokenData.pools[0];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    liquidityTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.liquidityTokenMint
      );

    await inceptClient.initializeLiquidityPosition(
      new BN(10000000000000),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      liquidityTokenAccountInfo.address,
      0
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    liquidityTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.liquidityTokenMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      500000,
      "check usdi"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      100000,
      "check iasset"
    );
    assert.equal(
      Number(liquidityTokenAccountInfo.amount) / 100000000,
      5000000,
      "check liquidity tokens"
    );

    const usdiAccountBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.usdiTokenAccount,
        "confirmed"
      );
    assert.equal(
      usdiAccountBalance.value!.uiAmount,
      500000,
      "check usdi account balance"
    );

    const iassetAccountBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.iassetTokenAccount,
        "confirmed"
      );
    assert.equal(
      iassetAccountBalance.value!.uiAmount,
      100000,
      "check iasset account balance"
    );
  });

  it("liquidity provided!", async () => {
    const tokenData = await inceptClient.getTokenData();
    const poolIndex = 0;
    let pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    liquidityTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.liquidityTokenMint
      );

    await inceptClient.provideLiquidity(
      new BN(100000000),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      liquidityTokenAccountInfo.address,
      poolIndex
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    liquidityTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.liquidityTokenMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      499995,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      99999,
      "check user iAsset balance"
    );
    assert.equal(
      Number(liquidityTokenAccountInfo.amount) / 100000000,
      5000049.95,
      "check liquidity token balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      500005,
      "check USDi pool balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      100001,
      "check iAsset pool balance"
    );
  });

  it("liquidity withdrawn!", async () => {
    const tokenData = await inceptClient.getTokenData();
    const poolIndex = 0;
    const pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    liquidityTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.liquidityTokenMint
      );

    await inceptClient.withdrawLiquidity(
      new BN(45453545454500),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      liquidityTokenAccountInfo.address,
      poolIndex
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    liquidityTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.liquidityTokenMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      545448.5445309,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      109089.70890618,
      "check user iAsset balance"
    );
    assert.equal(
      Number(liquidityTokenAccountInfo.amount) / 100000000,
      4545514.495455,
      "check user liquidity token balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      454551.4554691,
      "check pool usdi balance."
    );

    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      90910.29109382,
      "check pool iAsset balance."
    );
  });

  it("iasset bought!", async () => {
    const tokenData = await inceptClient.getTokenData();
    const poolIndex = 0;
    const pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.buySynth(
      new BN(1000000000000),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      poolIndex
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      489268.86091785,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      119089.70890618,
      "check user iAsset balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "confirmed"
          )
        ).value!.uiAmount
      ),
      510731.13908215,
      "check pool usdi balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "confirmed"
          )
        ).value!.uiAmount
      ),
      80910.29109382,
      "check pool iAsset balance"
    );
  });

  it("iasset sold!", async () => {
    const tokenData = await inceptClient.getTokenData();
    const poolIndex = 0;
    const pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.sellSynth(
      new BN(1000000000000),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      poolIndex
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      545448.54453091,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      109089.70890618,
      "check user iAsset balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "confirmed"
          )
        ).value!.uiAmount
      ),
      454551.45546909,
      "check pool usdi balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "confirmed"
          )
        ).value!.uiAmount
      ),
      90910.29109382,
      "check pool iAsset balance"
    );
  });

  it("single pool comet initialized!", async () => {
    await inceptClient.initializeSinglePoolComet(0, 0);

    await sleep(200);

    const singlePoolComets = await inceptClient.getSinglePoolComets();

    assert.equal(
      Number(singlePoolComets.numComets),
      1,
      "ensure comet position was initialized"
    );
  });

  it("single pool comet collateral added!", async () => {
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    await inceptClient.addCollateralToSinglePoolComet(
      mockUSDCTokenAccountInfo.address,
      new BN(2550000000),
      0
    );

    await sleep(200);

    const tokenData = await inceptClient.getTokenData();
    const collateral = tokenData.collaterals[0];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999978999745,
      "check user USDC"
    );

    const vault = await inceptClient.connection.getTokenAccountBalance(
      collateral.vault,
      "recent"
    );

    assert.equal(vault.value!.uiAmount, 21000255, "check vault balance");
  });

  it("single pool comet collateral withdrawn!", async () => {
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    await inceptClient.withdrawCollateralFromSinglePoolComet(
      mockUSDCTokenAccountInfo.address,
      new BN(50000000),
      0
    );

    await sleep(200);

    const tokenData = await inceptClient.getTokenData();
    const collateral = tokenData.collaterals[0];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999978999750,
      "check user USDI"
    );

    const vault = await inceptClient.connection.getTokenAccountBalance(
      collateral.vault,
      "recent"
    );

    assert.equal(vault.value!.uiAmount, 21000250, "check vault balance");
  });

  it("single pool comet liquidity added!", async () => {
    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );

    await inceptClient.addLiquidityToSinglePoolComet(new BN(51000000000), 0);

    await sleep(200);

    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[0];

    const usdiAccountBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.usdiTokenAccount,
        "recent"
      );

    assert.equal(
      usdiAccountBalance.value!.uiAmount,
      455061.45546909,
      "check usdi pool balance"
    );

    const iassetTokenBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.iassetTokenAccount,
        "recent"
      );

    assert.equal(
      iassetTokenBalance.value!.uiAmount,
      91012.29109402,
      "check iasset pool balance"
    );
  });

  it("single pool comet liquidity subtracted!", async () => {
    let poolIndex = 0;
    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.withdrawLiquidityFromSinglePoolComet(
      iassetTokenAccountInfo.address,
      usdiTokenAccountInfo.address,
      new BN(1000000000),
      0
    );

    await sleep(200);

    const usdiAccountBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.usdiTokenAccount,
        "recent"
      );

    assert.equal(
      usdiAccountBalance.value!.uiAmount,
      455051.45546909,
      "check usdi pool balance"
    );

    const iassetTokenBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.iassetTokenAccount,
        "recent"
      );

    assert.equal(
      iassetTokenBalance.value!.uiAmount,
      91010.29109402,
      "check iasset pool balance"
    );
  });

  it("iasset bought!", async () => {
    let poolIndex = 0;
    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[poolIndex];

    let withdrawableCollateral =
      await inceptClient.calculateMaxWithdrawableCollateral(0);
    assert.equal(withdrawableCollateral, 103.55236688391187);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.buySynth(
      new BN(1000000000000),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      poolIndex
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      489276.48918785,
      "check user usdi balance."
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      119089.70890618,
      "check user iAsset balance."
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      511223.51081215,
      "check pool usdi"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      81010.29109402,
      "check pool iAsset"
    );

    withdrawableCollateral =
      await inceptClient.calculateMaxWithdrawableCollateral(0);
    assert.equal(withdrawableCollateral, 0);
  });

  it("single pool comet recentered!", async () => {
    let poolIndex = 0;
    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[poolIndex];
    const collateral = tokenData.collaterals[0];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.recenterSinglePoolComet(
      iassetTokenAccountInfo.address,
      0
    );

    await sleep(200);

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            collateral.vault,
            "confirmed"
          )
        ).value!.uiAmount
      ),
      21000250,
      "check usdc collateral vault"
    );

    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999978999750,
      "check user usdc balance"
    );
    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      489276.48918785,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      119089.70890618,
      "check user iAsset balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      511292.9394202,
      "check pool usdi"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      80999.29068444,
      "check pool iAsset"
    );
  });

  it("single pool comet closed!", async () => {
    let poolIndex = 0;
    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[poolIndex];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    const prevSolanaBalance = await inceptClient.connection.getBalance(
      walletPubkey
    );

    await inceptClient.closeSinglePoolComet(
      mockUSDCTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      usdiTokenAccountInfo.address,
      0
    );

    await sleep(200);

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(mockUSDCTokenAccountInfo.amount) / 10000000,
      999978999992.3646,
      "check user usdc balance"
    );
    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      489276.48918785,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      119089.70890618,
      "check user iAsset balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      510731.14607716,
      "check pool usdi"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      80910.29109382,
      "check pool iAsset"
    );

    const singlePoolComets = await inceptClient.getSinglePoolComets();
    assert.equal(
      Number(singlePoolComets.numComets),
      0,
      "check num single pool comets"
    );

    const currentSolanaBalance = await inceptClient.connection.getBalance(
      walletPubkey
    );
    assert.isAbove(
      currentSolanaBalance,
      prevSolanaBalance,
      "should have more lamports after close"
    );
  });

  it("comet initialized!", async () => {
    await inceptClient.initializeComet();
  });

  it("comet collateral added!", async () => {
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    let comet = await inceptClient.getComet();
    await inceptClient.addCollateralToComet(
      usdiTokenAccountInfo.address,
      toDevnetScale(100000),
      1,
      false
    );

    await sleep(200);

    const tokenData = await inceptClient.getTokenData();
    const collateral = tokenData.collaterals[1];
    comet = await inceptClient.getComet();

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      389276.48918785,
      "check user USDi"
    );

    const vault = await inceptClient.connection.getTokenAccountBalance(
      collateral.vault,
      "recent"
    );
    assert.equal(vault.value!.uiAmount, 100000, "check vault balance");
  });

  it("comet collateral withdrawn!", async () => {
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    await inceptClient.withdrawCollateralFromComet(
      usdiTokenAccountInfo.address,
      toDevnetScale(10000),
      0,
      false
    );

    await sleep(200);

    const tokenData = await inceptClient.getTokenData();
    const collateral = tokenData.collaterals[1];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      389276.48918785 + 10000,
      "check user USDi"
    );

    const vault = await inceptClient.connection.getTokenAccountBalance(
      collateral.vault,
      "recent"
    );
    assert.equal(vault.value!.uiAmount, 100000 - 10000, "check vault balance");
  });

  it("comet liquidity added!", async () => {
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    await inceptClient.addLiquidityToComet(new BN(400000000), 0, false);

    await sleep(200);

    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[0];

    const usdiAccountBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.usdiTokenAccount,
        "recent"
      );

    assert.equal(
      usdiAccountBalance.value!.uiAmount,
      510735.14607716,
      "check usdi pool balance"
    );

    const iassetTokenBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.iassetTokenAccount,
        "recent"
      );

    assert.equal(
      iassetTokenBalance.value!.uiAmount,
      80910.92477588,
      "check iasset pool balance"
    );
  });

  it("multi pool comet health check", async () => {
    let healthScore = await inceptClient.getHealthScore();

    assert.equal(healthScore, 99.99995158799187, "check health score.");

    await inceptClient.updatePoolHealthScoreCoefficient(
      healthScoreCoefficient * 2,
      0
    );
    await inceptClient.updateILHealthScoreCoefficient(
      ilHealthScoreCoefficient * 2
    );

    healthScore = await inceptClient.getHealthScore();
    assert.equal(healthScore, 99.99990317598373, "check health score.");

    const totalILD = await inceptClient.getILD();
    const poolILD = await inceptClient.getILD(0);
    assert.equal(totalILD, poolILD, "check ILD calculation");
  });

  it("comet liquidity withdrawn!", async () => {
    const tokenData = await inceptClient.getTokenData();
    const poolIndex = 0;
    const pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );
    await inceptClient.withdrawLiquidityFromComet(
      iassetTokenAccountInfo.address,
      usdiTokenAccountInfo.address,
      new BN(50000000),
      0,
      false
    );

    await sleep(200);

    const usdiAccountBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.usdiTokenAccount,
        "recent"
      );

    assert.equal(
      usdiAccountBalance.value!.uiAmount,
      510734.64607716,
      "check usdi pool balance"
    );

    const iassetTokenBalance =
      await inceptClient.connection.getTokenAccountBalance(
        pool.iassetTokenAccount,
        "recent"
      );

    assert.equal(
      iassetTokenBalance.value!.uiAmount,
      80910.84556563,
      "check iasset pool balance"
    );
  });

  it("hackathon USDI mint", async () => {
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    const currentUSDI = Number(usdiTokenAccountInfo.amount) / 100000000;

    await inceptClient.hackathonMintUsdi(
      usdiTokenAccountInfo.address,
      500000000000000
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      currentUSDI + 5000000,
      "usdi not minted properly!"
    );
  });

  it("iasset bought!", async () => {
    let poolIndex = 0;
    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.buySynth(
      new BN(1000000000000),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      poolIndex
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      5327251.59059819,
      "check user usdi balance."
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      129089.70890618,
      "check user iAsset balance."
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      582759.54466682,
      "check pool usdi"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      70910.84556563,
      "check pool iAsset"
    );
  });

  it("multi pool comet recentered!", async () => {
    let poolIndex = 0;
    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[poolIndex];
    const collateral = tokenData.collaterals[0];

    mockUSDCTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        mockUSDCMint.publicKey
      );
    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.recenterComet(
      iassetTokenAccountInfo.address,
      0,
      0,
      false
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      5327251.59059819,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      129089.70890618,
      "check user iAsset balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      582760.10370115,
      "check pool usdi"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      70910.77754176,
      "check pool iAsset"
    );
  });

  it("comet liquidation", async () => {
    const { userPubkey, bump } = await inceptClient.getUserAddress();

    let tokenData = await inceptClient.getTokenData();
    const poolIndex = 0;
    let pool = tokenData.pools[poolIndex];
    const comet = await inceptClient.getComet();

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    await inceptClient.hackathonMintUsdi(
      usdiTokenAccountInfo.address,
      8000000 * 100000000
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.buySynth(
      new BN("5999800000000"),
      usdiTokenAccountInfo.address,
      iassetTokenAccountInfo.address,
      poolIndex
    );

    await sleep(2000);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );

    await inceptClient.updatePoolHealthScoreCoefficient(3000000, 0);
    await inceptClient.updateILHealthScoreCoefficient(0.00001);
    // Check that the score is zero.
    let healthScore1 = await inceptClient.getHealthScore();

    await inceptClient.liquidateCometPositionReduction(
      inceptClient.provider.wallet.publicKey,
      0,
      toScaledNumber(comet.positions[0].liquidityTokenValue)
    );

    await sleep(200);

    let healthScore2 = await inceptClient.getHealthScore();

    assert.isAbove(
      healthScore2,
      healthScore1,
      "check liquidation for reducing position"
    );
    // Reduce IL.
    await inceptClient.updateILHealthScoreCoefficient(100000);

    let healthScore3 = await inceptClient.getHealthScore();

    // Reduce IL liquidation
    await inceptClient.liquidateCometILReduction(
      inceptClient.provider.wallet.publicKey,
      0,
      0,
      0.2
    );

    let healthScore4 = await inceptClient.getHealthScore();

    assert.isAbove(
      healthScore4,
      healthScore3,
      "check liquidation for reducing IL"
    );
  });

  it("comet closed!", async () => {
    let poolIndex = 0;
    const tokenData = await inceptClient.getTokenData();
    const pool = tokenData.pools[poolIndex];

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    await inceptClient.closeComet(
      iassetTokenAccountInfo.address,
      usdiTokenAccountInfo.address,
      0,
      false
    );

    await sleep(200);

    usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
      inceptClient.manager.usdiMint
    );
    iassetTokenAccountInfo =
      await inceptClient.getOrCreateAssociatedTokenAccount(
        pool.assetInfo.iassetMint
      );

    assert.equal(
      Number(usdiTokenAccountInfo.amount) / 100000000,
      10123560.20631078,
      "check user usdi balance"
    );
    assert.equal(
      Number(iassetTokenAccountInfo.amount) / 100000000,
      189087.49731995,
      "check user iAsset balance"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.usdiTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      3786794.4981962,
      "check pool usdi"
    );
    assert.equal(
      Number(
        (
          await inceptClient.connection.getTokenAccountBalance(
            pool.iassetTokenAccount,
            "recent"
          )
        ).value!.uiAmount
      ),
      10912.50268005,
      "check pool iAsset"
    );

    const multiPoolComet = await inceptClient.getComet();
    assert.equal(
      Number(multiPoolComet.numPositions),
      0,
      "check comet position"
    );
  });
});
