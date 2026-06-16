"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { getLostAndFoundContract } from "@/lib/contractHelpers";
import { resolveIPFS } from "@/hooks/useIPFS";
import { useTransaction } from "@/hooks/useTransaction";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MapPin, Coins, Calendar, ArrowLeft, Send, CheckCircle, ShieldAlert, XCircle } from "lucide-react";
import { ethers } from "ethers";

interface ClaimType {
  id: bigint;
  itemId: bigint;
  claimant: string;
  proofIPFS: string;
  status: number; // 0: Pending, 1: Verified, 2: Rejected
  timestamp: bigint;
}

export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const itemId = resolvedParams.id;
  const { account, provider, signer, isCorrectNetwork } = useWallet();
  const { execute, isPending } = useTransaction();
  const router = useRouter();

  // State
  const [item, setItem] = useState<any>(null);
  const [claims, setClaims] = useState<ClaimType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItemDetails = async () => {
    if (!provider || !isCorrectNetwork) return;
    setIsLoading(true);
    try {
      const contract = getLostAndFoundContract(provider);
      if (!contract) return;

      const rawItem = await contract.getItem(Number(itemId));
      setItem({
        id: rawItem.id,
        owner: rawItem.owner,
        description: rawItem.description,
        photoIPFS: rawItem.photoIPFS,
        reward: rawItem.reward,
        status: Number(rawItem.status),
        timestamp: rawItem.timestamp,
        location: rawItem.location
      });

      // Fetch claims
      const claimIds: bigint[] = await contract.getClaimsByItem(Number(itemId));
      const claimsList: ClaimType[] = [];
      for (const cid of claimIds) {
        const c = await contract.getClaim(Number(cid));
        claimsList.push({
          id: c.id,
          itemId: c.itemId,
          claimant: c.claimant,
          proofIPFS: c.proofIPFS,
          status: Number(c.status),
          timestamp: c.timestamp
        });
      }
      setClaims(claimsList);
    } catch (err) {
      console.error("Error fetching item detail:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider && isCorrectNetwork) {
      fetchItemDetails();
    } else {
      // Mock data for presentation mode
      if (itemId === "1") {
        setItem({
          id: 1n,
          owner: "0x1234567890123456789012345678901234567890",
          description: "Black leather wallet containing Aadhaar card, driving license and credit cards.",
          photoIPFS: "ipfs://mock-wallet",
          reward: 20000000000000000n, // 0.02 ETH
          status: 0,
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600),
          location: "Koregaon Park"
        });
        setClaims([]);
      } else if (itemId === "2") {
        setItem({
          id: 2n,
          owner: "0x2345678901234567890123456789012345678901",
          description: "Dell Latitude laptop left in a cafe with a silver stickers on the shell.",
          photoIPFS: "ipfs://mock-laptop",
          reward: 250000000000000000n, // 0.25 ETH
          status: 1,
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 7200),
          location: "Baner"
        });
        setClaims([
          {
            id: 1n,
            itemId: 2n,
            claimant: "0x9876543210987654321098765432109876543210",
            proofIPFS: "ipfs://mock-laptop-proof",
            status: 0, // Pending
            timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600)
          }
        ]);
      } else {
        setItem(null);
      }
      setIsLoading(false);
    }
  }, [provider, isCorrectNetwork, itemId]);

  // Actions
  const handleVerify = async (claimId: number) => {
    try {
      const contract = getLostAndFoundContract(signer);
      if (!contract) return;

      const txPromise = contract.verifyClaim(claimId);
      await execute(txPromise, {
        pendingMessage: "Approving claim and triggering Escrow release & NFT mint...",
        successMessage: "Claim verified! Escrow reward released and certificate minted to finder.",
        errorMessage: "Failed to verify claim.",
        triggerConfetti: true,
        onSuccess: () => {
          fetchItemDetails();
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (claimId: number) => {
    try {
      const contract = getLostAndFoundContract(signer);
      if (!contract) return;

      const txPromise = contract.rejectClaim(claimId);
      await execute(txPromise, {
        pendingMessage: "Rejecting claim and triggering Escrow refund...",
        successMessage: "Claim rejected! Escrow funds successfully refunded to your wallet.",
        errorMessage: "Failed to reject claim.",
        onSuccess: () => {
          fetchItemDetails();
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Item Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            The requested lost item does not exist or has been deleted from the registry.
          </p>
          <Link href="/items" className="text-saffron hover:underline text-sm font-bold flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to registry
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = account && item.owner.toLowerCase() === account.toLowerCase();
  const dateStr = new Date(Number(item.timestamp) * 1000).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const hasAlreadyClaimed = claims.some((c) => account && c.claimant.toLowerCase() === account.toLowerCase());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
      
      {/* Back Button */}
      <Link href="/items" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-saffron transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Registry
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Image, Stats, Info (Span 7) */}
        <div className="md:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 relative">
            <div className="w-full aspect-video bg-slate-900/50 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveIPFS(item.photoIPFS)}
                alt={item.description}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-item.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-transparent to-transparent opacity-80" />
            </div>
            
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <span className="flex items-center gap-1.5 text-slate-300 text-sm font-semibold">
                  <MapPin className="w-4 h-4 text-saffron" />
                  {item.location}
                </span>
                
                <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Listed: {dateStr}
                </span>
              </div>

              <h1 className="text-xl md:text-2xl font-black text-white leading-relaxed mb-6">
                {item.description}
              </h1>

              {/* Escrow Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-saffron/10 border border-saffron/20">
                <div className="flex items-center gap-3">
                  <Coins className="w-6 h-6 text-saffron" />
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Escrow Reward Pool</span>
                    <h3 className="text-lg font-black text-saffron">{ethers.formatEther(item.reward)} ETH</h3>
                  </div>
                </div>
                
                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded font-bold uppercase">
                  Escrow Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Actions & Claim History (Span 5) */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Action Box */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-slate-200 mb-4 pb-2 border-b border-white/5">
              Workflows &amp; Access Control
            </h3>

            {/* Owner Actions */}
            {isOwner ? (
              <div className="space-y-3">
                <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 p-3 rounded-lg font-medium">
                  You are the creator of this listing. Review claims submitted below.
                </p>
              </div>
            ) : (
              <div>
                {item.status === 0 || item.status === 1 ? (
                  hasAlreadyClaimed ? (
                    <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 p-3 rounded-lg font-medium">
                      You have already submitted a claim for this item. Monitor its status in your Dashboard.
                    </p>
                  ) : (
                    <Link
                      href={`/claim/${item.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-light hover:to-saffron text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.35)] active:scale-[0.98] cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Submit Found Claim
                    </Link>
                  )
                ) : (
                  <p className="text-xs text-slate-400 bg-white/5 p-3 rounded-lg font-medium">
                    This lost item listing has been resolved (either verified or refunded) and is no longer open for claims.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Claims Timeline Dashboard */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-slate-200 mb-6 pb-2 border-b border-white/5">
              Claims Submitted ({claims.length})
            </h3>

            {claims.length > 0 ? (
              <div className="space-y-6">
                {claims.map((claim) => (
                  <div
                    key={claim.id.toString()}
                    className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 bg-black/30 px-2 py-0.5 rounded">
                        Claimant: {claim.claimant.slice(0, 6)}...{claim.claimant.slice(-4)}
                      </span>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        claim.status === 0
                          ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                          : claim.status === 1
                          ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                          : "text-rose-400 bg-rose-400/10 border-rose-400/20"
                      }`}>
                        {claim.status === 0 ? "Pending" : claim.status === 1 ? "Verified" : "Rejected"}
                      </span>
                    </div>

                    {/* Proof image */}
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveIPFS(claim.proofIPFS)}
                        alt="Proof"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Timeline */}
                    <div className="text-xs text-slate-400 mt-2">
                      Proof Hash: <span className="font-mono text-[10px] block truncate">{claim.proofIPFS}</span>
                    </div>

                    {/* Actions for Item Owner */}
                    {isOwner && claim.status === 0 && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleVerify(Number(claim.id))}
                          disabled={isPending}
                          className="flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-[0_2px_10px_rgba(16,185,129,0.2)] disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verify Claim
                        </button>
                        <button
                          onClick={() => handleReject(Number(claim.id))}
                          disabled={isPending}
                          className="flex items-center justify-center gap-1 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-[0_2px_10px_rgba(244,63,94,0.2)] disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Claim
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                No claim submissions reported yet for this item.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
