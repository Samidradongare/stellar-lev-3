"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { simulateContractCall } from "@/lib/contractHelpers";
import { 
  buildGetItemsByOwnerArgs, 
  buildGetClaimsByItemArgs, 
  buildGetItemArgs, 
  parseItem, 
  parseClaim, 
  buildGetTotalItemsArgs,
  ParsedItem
} from "@/lib/abis";
import ItemCard from "@/components/ItemCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { LayoutDashboard, Award, PlusCircle, ShieldAlert, Archive, Clock, CheckCircle } from "lucide-react";
import { scValToNative } from "@stellar/stellar-sdk";

export default function Dashboard() {
  const { account, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<"posts" | "claims">("posts");
  const [postedItems, setPostedItems] = useState<any[]>([]);
  const [claimedItems, setClaimedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!account) return;
    setIsLoading(true);
    try {
      // 1. Fetch items owned by user
      const ownedItemIdsVal = await simulateContractCall(
        "get_items_by_owner",
        buildGetItemsByOwnerArgs(account)
      );
      const ownedItemIds = scValToNative(ownedItemIdsVal) as number[];
      
      const ownedList: any[] = [];
      for (const id of ownedItemIds) {
        const itemVal = await simulateContractCall("get_item", buildGetItemArgs(id));
        const item = parseItem(itemVal);
        ownedList.push(item);
      }
      setPostedItems(ownedList.sort((a, b) => b.timestamp - a.timestamp));

      // 2. Scan all claims to find those submitted by user
      const claimsList: any[] = [];
      const totalItemsVal = await simulateContractCall("get_total_items", buildGetTotalItemsArgs());
      const totalItems = scValToNative(totalItemsVal) as number;

      for (let itemId = 1; itemId <= totalItems; itemId++) {
        try {
          const itemVal = await simulateContractCall("get_item", buildGetItemArgs(itemId));
          const item = parseItem(itemVal);
          
          const claimIdsVal = await simulateContractCall("get_claims_by_item", buildGetClaimsByItemArgs(itemId));
          const claimIds = scValToNative(claimIdsVal) as number[];
          
          for (const cid of claimIds) {
            const { buildGetClaimArgs } = await import("@/lib/abis");
            const actualClaimVal = await simulateContractCall("get_claim", buildGetClaimArgs(cid));
            const claim = parseClaim(actualClaimVal);
            
            if (claim.claimant === account) {
              claimsList.push({
                claimId: claim.id,
                itemId: item.id,
                description: item.description,
                location: item.location,
                reward: (Number(item.reward) / 1e7).toFixed(2), // Format XLM
                photoIPFS: item.photoIPFS,
                claimStatus: claim.status, 
                itemStatus: item.status,
                timestamp: claim.timestamp
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching item ${itemId} claims:`, err);
        }
      }
      
      setClaimedItems(claimsList.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchDashboardData();
    } else {
      setPostedItems([]);
      setClaimedItems([]);
    }
  }, [account]);

  const getClaimStatusDetails = (status: string) => {
    switch (status) {
      case "Pending":
        return { text: "Pending Verification", style: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
      case "Verified":
        return { text: "Verified & Rewarded", style: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
      case "Rejected":
        return { text: "Rejected", style: "text-rose-400 bg-rose-400/10 border-rose-400/20" };
      default:
        return { text: "Unknown", style: "text-slate-400 bg-slate-400/10 border-slate-400/20" };
    }
  };

  // State: Wallet Disconnected
  if (!account) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Wallet Disconnected</h2>
          <p className="text-sm text-slate-400 mb-6">
            Please connect your Freighter wallet to access your custom dashboard.
          </p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 rounded-xl bg-saffron hover:bg-saffron-dark text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)] cursor-pointer"
          >
            Connect Freighter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col">
      
      {/* Title */}
      <div className="flex items-center gap-2 mb-8 pb-4 border-b border-white/5">
        <LayoutDashboard className="w-7 h-7 text-saffron" />
        <div>
          <h1 className="text-2xl font-black text-white">Your Dashboard</h1>
          <p className="text-xs text-slate-400">Manage your reported lost items and track your found claims.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-white/5 mb-8">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "posts"
              ? "text-saffron border-saffron"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          My Posted Items ({postedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "claims"
              ? "text-saffron border-saffron"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          My Submitted Claims ({claimedItems.length})
        </button>
      </div>

      {/* Contents Display */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeTab === "posts" ? (
        postedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {postedItems.map((item) => (
              <ItemCard key={item.id.toString()} item={item as any} />
            ))}
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-16">
            <Archive className="w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No Items Listed</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mb-6">
              You haven't reported any lost items on the PuneFinder network yet.
            </p>
            <Link
              href="/post"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-saffron hover:bg-saffron-dark text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost Item
            </Link>
          </div>
        )
      ) : (
        claimedItems.length > 0 ? (
          <div className="space-y-4">
            {claimedItems.map((claim) => {
              const statusDetails = getClaimStatusDetails(claim.claimStatus);
              return (
                <div
                  key={claim.claimId}
                  className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-white/5"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 aspect-square rounded-xl bg-slate-900 overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={claim.photoIPFS.startsWith("ipfs://") ? `/placeholder-item.jpg` : claim.photoIPFS}
                        alt="Claimed Item"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Claim ID: #{claim.claimId}</span>
                      <h4 className="text-sm font-bold text-slate-100 truncate">{claim.description}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        Location: {claim.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${statusDetails.style}`}>
                      {statusDetails.text}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      Reward Pool: <strong className="text-saffron">{claim.reward} XLM</strong>
                    </span>
                    <Link
                      href={`/items/${claim.itemId}`}
                      className="text-xs font-bold text-deep-blue-light hover:text-saffron mt-1 underline"
                    >
                      View Timeline &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-16">
            <Award className="w-12 h-12 text-slate-500 mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-300">No Claims Submitted</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mb-6">
              You haven't reported finding any lost items or submitted verification proofs yet.
            </p>
            <Link
              href="/items"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-saffron hover:bg-saffron-dark text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)] cursor-pointer"
            >
              Browse Registry
            </Link>
          </div>
        )
      )}
    </div>
  );
}
