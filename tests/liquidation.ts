import * as anchor from "@project-serum/anchor";
import { Program, BN } from "@project-serum/anchor";
import { Incept } from "../sdk/src/idl/incept";
import { Pyth } from "../sdk/src/idl/pyth";
import { MockUsdc } from "../sdk/src/idl/mock_usdc";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import {
  Incept as InceptConnection,
  TokenData,
  User,
  MintPositions,
  LiquidityPositions,
  Manager,
  Pool,
} from "../sdk/src/incept";
import { createPriceFeed, setPrice, getFeedData } from "../sdk/src/oracle";
import { Network } from "../sdk/src/network";
import { INCEPT_EXCHANGE_SEED } from "./utils";
import { sleep } from "../sdk/src/utils";

const RENT_PUBKEY = anchor.web3.SYSVAR_RENT_PUBKEY;
const SYSTEM_PROGRAM_ID = anchor.web3.SystemProgram.programId;


describe('liquidation testing', function () {
    let inceptClient;
    let walletPubkey;
    let priceFeed;
    let mockUSDCTokenAccountInfo;
    let usdiTokenAccountInfo;
    let iassetTokenAccountInfo;
    let liquidityTokenAccountInfo;
    let mockUSDCMint;
    let pythProgram;

    before('setup incept client', async () => {
        const provider = anchor.Provider.local();
        anchor.setProvider(provider);

        const inceptProgram = anchor.workspace.Incept as Program<Incept>;
        pythProgram = anchor.workspace.Pyth as Program<Pyth>;
        const mockUSDCProgram = anchor.workspace.MockUsdc as Program<MockUsdc>;

        mockUSDCMint = anchor.web3.Keypair.generate();
        walletPubkey = inceptProgram.provider.wallet.publicKey;
        
        const mockUSDCAccount = await anchor.web3.PublicKey.findProgramAddress(
            [Buffer.from("mock_usdc")],
            mockUSDCProgram.programId
        );


        inceptClient = new InceptConnection(
            inceptProgram.programId,
            provider
        ) as InceptConnection;

        await inceptClient.initializeManager();
        
        await inceptClient.initializeUser();

        let price = 10;
        const expo = -7;
        const conf = new BN((price / 10) * 10 ** -expo);
    
        priceFeed = await createPriceFeed(pythProgram, price, expo, conf);

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

        await inceptClient.addCollateral(
            walletPubkey,
            7,
            1,
            mockUSDCMint.publicKey
        );

        await inceptClient.initializePool(walletPubkey, 150, 200, priceFeed);

        await sleep(200);

        const tokenData = await inceptClient.getTokenData()
        const pool = tokenData.pools[0];

        mockUSDCTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(mockUSDCMint.publicKey);
        usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(inceptClient.manager.usdiMint);
        liquidityTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(pool.liquidityTokenMint);
        iassetTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(pool.assetInfo.iassetMint);

        await mockUSDCProgram.rpc.mintMockUsdc(mockUSDCAccount[1], {
            accounts: {
            mockUsdcMint: mockUSDCMint.publicKey,
            mockUsdcTokenAccount: mockUSDCTokenAccountInfo.address,
            mockUsdcAccount: mockUSDCAccount[0],
            tokenProgram: TOKEN_PROGRAM_ID,
            },
            signers: [],  
        });

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

        await inceptClient.initializeMintPositions(
            new BN(20000000000000),
            new BN(200000000000000),
            mockUSDCTokenAccountInfo.address,
            iassetTokenAccountInfo.address,
            0,
            0,
            signers
        );

        await inceptClient.initializeLiquidityPosition(
            new BN(10000000000000),
            usdiTokenAccountInfo.address,
            iassetTokenAccountInfo.address,
            liquidityTokenAccountInfo.address,
            0
        );

    });

    it("mint position liquidation", async () => {

        // Add more concentrated liquidity to the pool.
        await inceptClient.initializeComet(
            mockUSDCTokenAccountInfo.address,
            new BN(250000000000),
            new BN(5000000000000),
            0,
            0
          );

        usdiTokenAccountInfo = await inceptClient.getOrCreateAssociatedTokenAccount(
            inceptClient.manager.usdiMint
        );

        await inceptClient.hackathonMintUsdi(
            usdiTokenAccountInfo.address,
            5000000000000000,
        );

        await sleep(200)

        // buy to burn
        await inceptClient.buySynth(
            new BN(20_350_000_000_000),
            usdiTokenAccountInfo.address,
            iassetTokenAccountInfo.address,
            0
        );

        await sleep(200);

        await setPrice(pythProgram, 67, priceFeed);

        const {userPubkey, _bump} = await inceptClient.getUserAddress();

        let beforeLiquidationIasset = await inceptClient.connection.getTokenAccountBalance(
            iassetTokenAccountInfo.address,
            "recent"
        );
        let beforeLiquidationCollateral = await inceptClient.connection.getTokenAccountBalance(
            mockUSDCTokenAccountInfo.address,
            "recent"
        );

        // call liquidation.
        await inceptClient.liquidateMintPosition(
            userPubkey, 0
        );

        await sleep(200);

        let afterLiquidationIasset = await inceptClient.connection.getTokenAccountBalance(
            iassetTokenAccountInfo.address,
            "recent"
        );
        let afterLiquidationCollateral = await inceptClient.connection.getTokenAccountBalance(
            mockUSDCTokenAccountInfo.address,
            "recent"
        );

        assert.equal(beforeLiquidationIasset.value.uiAmount - afterLiquidationIasset.value.uiAmount, 200000, 'check liquidated amount');
        assert.equal(afterLiquidationCollateral.value.uiAmount - beforeLiquidationCollateral.value.uiAmount, 20000000, 'check collateral received');
    });

});
  