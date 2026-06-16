"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { getLostAndFoundContract } from "@/lib/contractHelpers";
import ItemCard, { ItemType } from "@/components/ItemCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { LayoutDashboard, Award, PlusCircle, ShieldAlert, Archive, Clock, CheckCircle } from "lucide-react";
import { ethers } from "ethers";

export default function Dashboard() {
  const { account, provider, isCorrectNetwork, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<"posts" | "claims">("posts");
  const [postedItems, setPostedItems] = useState<ItemType[]>([]);
  const [claimedItems, setClaimedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!provider || !account || !isCorrectNetwork) return;
    setIsLoading(true);
    try {
      const contract = getLostAndFoundContract(provider);
      if (!contract) return;

      // 1. Fetch items owned by user
      const ownedItemIds: bigint[] = await contract.getItemsByOwner(account);
      const ownedList: ItemType[] = [];
      for (const id of ownedItemIds) {
        const item = await contract.getItem(Number(id));
        ownedList.push({
          id: item.id,
          owner: item.owner,
          description: item.description,
          photoIPFS: item.photoIPFS,
          reward: item.reward,
          status: Number(item.status),
          timestamp: item.timestamp,
          location: item.location
        });
      }
      setPostedItems(ownedList.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)));

      // 2. Scan all claims to find those submitted by user (Since contract has mapping by claimId, we scan or fetch items)
      // Since mapping by claimant is not natively indexable, we query all claims for all items
      // To optimize: we scan items and look inside their claims.
      const claimsList: any[] = [];
      let itemId = 1;
      while (true) {
        try {
          const item = await contract.getItem(itemId);
          const claimIds: bigint[] = await contract.getClaimsByItem(itemId);
          
          for (const cid of claimIds) {
            const claim = await contract.getClaim(Number(cid));
            if (claim.claimant.toLowerCase() === account.toLowerCase()) {
              claimsList.push({
                claimId: claim.id.toString(),
                itemId: item.id.toString(),
                description: item.description,
                location: item.location,
                reward: ethers.formatEther(item.reward),
                photoIPFS: item.photoIPFS,
                claimStatus: Number(claim.status), // 0: Pending, 1: Verified, 2: Rejected
                itemStatus: Number(item.status),
                timestamp: claim.timestamp
              });
            }
          }
          itemId++;
        } catch (err) {
          break; // break when getItem reverts
        }
      }
      
      setClaimedItems(claimsList.sort((a, b) => Number(b.timestamp) - Number(a.timestamp)));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider && account && isCorrectNetwork) {
      fetchDashboardData();
    } else {
      // Mock data for disconnected state
      setPostedItems([]);
      setClaimedItems([]);
    }
  }, [provider, account, isCorrectNetwork]);

  const getClaimStatusDetails = (status: number) => {
    switch (status) {
      case 0:
        return { text: "Pending Verification", style: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
      case 1:
        return { text: "Verified & Rewarded", style: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
      case 2:
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
            Please connect your wallet to access your custom dashboard.
          </p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 rounded-xl bg-saffron hover:bg-saffron-dark text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)] cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // State: Wrong Network
  if (!isCorrectNetwork) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Unsupported Network</h2>
          <p className="text-sm text-slate-400 mb-6">
            Please switch to Localhost or Polygon Amoy in MetaMask.
          </p>
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
              <ItemCard key={item.id.toString()} item={item} />
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
                      Reward Pool: <strong className="text-saffron">{claim.reward} ETH</strong>
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
