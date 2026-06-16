"use client";

import React from "react";
import { CheckCircle2, Clock, Award, ShieldX } from "lucide-react";

interface ClaimTimelineProps {
  claimStatus: number; // 0: Pending, 1: Verified, 2: Rejected
  claimTimestamp: bigint;
  itemStatus: number; // 0: Lost, 1: Claimed, 2: Verified, 3: Completed
}

export const ClaimTimeline: React.FC<ClaimTimelineProps> = ({
  claimStatus,
  claimTimestamp,
  itemStatus
}) => {
  const claimDate = new Date(Number(claimTimestamp) * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Steps definitions
  // 1. Submitted (Pending)
  // 2. Verified (Approved)
  // 3. Completed (Reward Released & NFT Minted)

  const isRejected = claimStatus === 2;

  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">
        Claim Status Timeline
      </h4>
      
      <div className="relative border-l border-white/10 pl-6 ml-3 space-y-8">
        
        {/* Step 1: Claim Submitted */}
        <div className="relative">
          {/* Node Icon */}
          <span className="absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-deep-blue border border-deep-blue-light text-blue-300">
            <Clock className="w-4 h-4" />
          </span>
          <div>
            <h5 className="font-bold text-slate-200 text-sm">Claim Submitted</h5>
            <p className="text-xs text-slate-400 mt-1">
              Proof images uploaded to IPFS. Awaiting review by the owner.
            </p>
            <span className="inline-block mt-2 text-[10px] text-slate-500 font-semibold bg-white/5 px-2 py-0.5 rounded">
              {claimDate}
            </span>
          </div>
        </div>

        {/* Step 2: Verification Status */}
        {!isRejected ? (
          <div className="relative">
            {/* Node Icon */}
            <span
              className={`absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                claimStatus >= 1
                  ? "bg-saffron text-white border border-saffron-light glow-saffron"
                  : "bg-dark-bg border border-white/10 text-slate-600"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <h5 className={`font-bold text-sm ${claimStatus >= 1 ? "text-slate-200" : "text-slate-500"}`}>
                Owner Verification
              </h5>
              <p className="text-xs text-slate-400 mt-1">
                {claimStatus >= 1
                  ? "The owner has verified the claim and approved the match."
                  : "Escrow funds locked. Waiting for owner to confirm the proof."}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Node Icon */}
            <span className="absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <ShieldX className="w-4 h-4" />
            </span>
            <div>
              <h5 className="font-bold text-rose-400 text-sm">Claim Rejected</h5>
              <p className="text-xs text-slate-400 mt-1">
                The owner rejected this claim. The escrowed reward was returned to the owner.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Certificate Minting & Escrow Release */}
        {!isRejected && (
          <div className="relative">
            {/* Node Icon */}
            <span
              className={`absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                claimStatus >= 1 && itemStatus === 2
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-emerald-400"
                  : "bg-dark-bg border border-white/10 text-slate-600"
              }`}
            >
              <Award className="w-4 h-4" />
            </span>
            <div>
              <h5
                className={`font-bold text-sm ${
                  claimStatus >= 1 && itemStatus === 2 ? "text-slate-200" : "text-slate-500"
                }`}
              >
                Reward & Certificate Released
              </h5>
              <p className="text-xs text-slate-400 mt-1">
                {claimStatus >= 1 && itemStatus === 2
                  ? "Escrow reward released to finder. FinderNFT certificate successfully minted."
                  : "Verification pending. Escrow funds locked in contract."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimTimeline;
