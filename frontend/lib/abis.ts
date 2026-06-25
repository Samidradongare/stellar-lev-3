/**
 * abis.ts — Soroban XDR helpers for LostAndFound contract
 * Replaces the old Solidity ABI definitions.
 */

import {
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";

// ─── Argument Builders ───────────────────────────────────────────────────────

export function buildPostLostItemArgs(
  owner: string,
  token: string,
  description: string,
  photoIPFS: string,
  location: string,
  reward: bigint
): xdr.ScVal[] {
  return [
    new Address(owner).toScVal(),
    new Address(token).toScVal(),
    nativeToScVal(description, { type: "string" }),
    nativeToScVal(photoIPFS, { type: "string" }),
    nativeToScVal(location, { type: "string" }),
    nativeToScVal(reward, { type: "i128" }),
  ];
}

export function buildSubmitClaimArgs(
  claimant: string,
  itemId: number,
  proofIPFS: string
): xdr.ScVal[] {
  return [
    new Address(claimant).toScVal(),
    nativeToScVal(itemId, { type: "u32" }),
    nativeToScVal(proofIPFS, { type: "string" }),
  ];
}

export function buildVerifyClaimArgs(
  owner: string,
  claimId: number
): xdr.ScVal[] {
  return [
    new Address(owner).toScVal(),
    nativeToScVal(claimId, { type: "u32" }),
  ];
}

export function buildRejectClaimArgs(
  owner: string,
  claimId: number
): xdr.ScVal[] {
  return [
    new Address(owner).toScVal(),
    nativeToScVal(claimId, { type: "u32" }),
  ];
}

export function buildGetItemArgs(itemId: number): xdr.ScVal[] {
  return [nativeToScVal(itemId, { type: "u32" })];
}

export function buildGetClaimArgs(claimId: number): xdr.ScVal[] {
  return [nativeToScVal(claimId, { type: "u32" })];
}

export function buildGetItemsByOwnerArgs(owner: string): xdr.ScVal[] {
  return [new Address(owner).toScVal()];
}

export function buildGetClaimsByItemArgs(itemId: number): xdr.ScVal[] {
  return [nativeToScVal(itemId, { type: "u32" })];
}

export function buildGetTotalItemsArgs(): xdr.ScVal[] {
  return [];
}

// ─── Response Parsers ────────────────────────────────────────────────────────

export type ItemStatus = "Lost" | "Claimed" | "Verified" | "Completed";
export type ClaimStatus = "Pending" | "Verified" | "Rejected";

export interface ParsedItem {
  id: number;
  owner: string;
  description: string;
  photoIPFS: string;
  token: string;
  reward: bigint;
  status: ItemStatus;
  timestamp: number;
  location: string;
}

export interface ParsedClaim {
  id: number;
  itemId: number;
  claimant: string;
  proofIPFS: string;
  status: ClaimStatus;
  timestamp: number;
}

export function parseItem(scVal: xdr.ScVal): ParsedItem {
  const raw = scValToNative(scVal);
  return {
    id: raw.id,
    owner: raw.owner.toString(),
    description: raw.description,
    photoIPFS: raw.photo_ipfs,
    token: raw.token.toString(),
    reward: BigInt(raw.reward),
    status: raw.status as ItemStatus,
    timestamp: Number(raw.timestamp),
    location: raw.location,
  };
}

export function parseClaim(scVal: xdr.ScVal): ParsedClaim {
  const raw = scValToNative(scVal);
  return {
    id: raw.id,
    itemId: raw.item_id,
    claimant: raw.claimant.toString(),
    proofIPFS: raw.proof_ipfs,
    status: raw.status as ClaimStatus,
    timestamp: Number(raw.timestamp),
  };
}

// ─── XLM Native Token Contract (Testnet) ─────────────────────────────────────
export const XLM_CONTRACT_ADDRESS =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYC"
