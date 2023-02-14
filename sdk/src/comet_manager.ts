import {
    PublicKey,
  } from "@solana/web3.js";
  import { BN } from "@project-serum/anchor";

  export interface ManagerInfo {
    inceptProgram: PublicKey;
    incept: PublicKey;
    owner: PublicKey;
    membershipTokenSupply: BN;
    userAccount: PublicKey;
    userBump: number;
    bump: number;
    status: Object;
    withdrawalFeeBps: number;
    managementFeeBps: number;
    feeClaimSlot: BN;
    userRedemptions: PublicKey[],
    redemptionStrikes: number;
    lastStrikeTimestamp: BN;
}

export interface RedemptionRequest {
  membershipTokens: BN;
  timestamp: BN;
}

export interface Subscriber {
    owner: PublicKey;
    manager: PublicKey;
    principal: BN;
    membershipTokens: BN;
    redemptionRequest?: RedemptionRequest;
}