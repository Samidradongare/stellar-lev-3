"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { getLostAndFoundContract } from "@/lib/contractHelpers";
import { Search, PlusCircle, Shield, Award, Landmark, RefreshCw, ArrowRight } from "lucide-react";
import { ethers } from "ethers";

export default function Home() {
  const { account, provider, isCorrectNetwork } = useWallet();
  const [stats, setStats] = useState({
    lost: 14,
    claimed: 6,
    returned: 12
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchBlockchainData = async () => {
    if (!provider || !isCorrectNetwork) return;
    setIsLoadingStats(true);
    try {
      const contract = getLostAndFoundContract(provider);
      if (!contract) return;

      // In a real environment, we'd query contract items
      // Let's query item count or loop to construct stats
      let lostCount = 0;
      let claimedCount = 0;
      let returnedCount = 0;

      const totalItemsBigInt = await contract.getTotalItems();
      const totalItems = Number(totalItemsBigInt);
      const fetchedItems = [];

      for (let id = 1; id <= totalItems; id++) {
        try {
          const item = await contract.getItem(id);
          fetchedItems.push(item);
          if (item.status === 0n) lostCount++; // Lost
          else if (item.status === 1n) claimedCount++; // Claimed
          else if (item.status === 2n) returnedCount++; // Verified
          else if (item.status === 3n) returnedCount++; // Completed
        } catch (e) {
          console.error(`Error fetching item ${id}:`, e);
        }
      }

      setStats({
        lost: lostCount,
        claimed: claimedCount,
        returned: returnedCount
      });

      // Map recent activities from items
      const sortedItems = [...fetchedItems].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      const activities = sortedItems.slice(0, 5).map((item) => ({
        id: item.id.toString(),
        type: item.status === 0 ? "post" : item.status === 1 ? "claim" : "resolved",
        title: item.status === 0 ? "New Lost Item Listed" : item.status === 1 ? "Claim Submitted" : "Item Successfully Returned",
        description: item.description,
        location: item.location,
        reward: ethers.formatEther(item.reward),
        timestamp: new Date(Number(item.timestamp) * 1000).toLocaleDateString()
      }));

      setRecentActivities(activities);
    } catch (err) {
      console.error("Error reading blockchain stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (provider && isCorrectNetwork) {
      fetchBlockchainData();

      const contract = getLostAndFoundContract(provider);
      if (contract) {
        const handleEvent = () => fetchBlockchainData();
        
        contract.on("ItemPosted", handleEvent);
        contract.on("ClaimSubmitted", handleEvent);
        contract.on("ClaimVerified", handleEvent);
        contract.on("ClaimRejected", handleEvent);

        return () => {
          contract.off("ItemPosted", handleEvent);
          contract.off("ClaimSubmitted", handleEvent);
          contract.off("ClaimVerified", handleEvent);
          contract.off("ClaimRejected", handleEvent);
        };
      }
    } else {
      // Setup mock data for presentation before connection
      setRecentActivities([
        {
          id: "m1",
          type: "resolved",
          title: "Item Successfully Returned",
          description: "Black leather wallet with Aadhaar Card",
          location: "Koregaon Park",
          reward: "0.05",
          timestamp: "Just now"
        },
        {
          id: "m2",
          type: "claim",
          title: "Claim Submitted",
          description: "Dell Latitude 5420 Laptop",
          location: "Baner",
          reward: "0.25",
          timestamp: "10 mins ago"
        },
        {
          id: "m3",
          type: "post",
          title: "New Lost Item Listed",
          description: "Car Keys (Hyundai)",
          location: "Kothrud",
          reward: "0.02",
          timestamp: "1 hour ago"
        }
      ]);
    }
  }, [provider, isCorrectNetwork]);

  return (
    <div className="flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 relative overflow-hidden flex flex-col items-center justify-center border-b border-white/5">
        <div className="absolute inset-0 bg-radial-gradient from-saffron/10 via-transparent to-transparent -z-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          {/* Hyperlocal tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-saffron/10 border border-saffron/30 text-saffron text-xs font-semibold mb-6 animate-pulse-subtle">
            <Landmark className="w-4 h-4" />
            Pune's Hyperlocal Decentralized Network
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Find What's <span className="text-saffron">Lost</span>,<br />
            Reward What's <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Found</span>.
          </h1>
          
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            PuneFinder is a decentralized hyperlocal lost-and-found system for Pune city. 
            Lock rewards securely in smart contract escrows, claim found matches, and mint official 
            <strong> FinderNFT</strong> return certificates on Polygon.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/items"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-light hover:to-saffron text-white font-bold transition-all shadow-[0_4px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_4px_25px_rgba(255,107,0,0.5)] active:scale-[0.98] cursor-pointer"
            >
              <Search className="w-5 h-5" />
              Browse Lost Items
            </Link>
            
            <Link
              href="/post"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-deep-blue/40 hover:bg-deep-blue/60 border border-deep-blue text-white font-bold transition-all backdrop-blur active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              Report Lost Item
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="w-full py-12 bg-[#080d26]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-slate-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-saffron" />
              Escrow Network Stats
            </h2>
            {account && isCorrectNetwork && (
              <button
                onClick={fetchBlockchainData}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Refresh stats"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStats ? "animate-spin text-saffron" : ""}`} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Stat Card 1 */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Lost Items Posted</span>
              <span className="text-4xl font-black text-rose-500 mb-1">
                {isLoadingStats ? "..." : stats.lost}
              </span>
              <span className="text-xs text-slate-500">Locked rewards in contract</span>
            </div>

            {/* Stat Card 2 */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Claim Submissions</span>
              <span className="text-4xl font-black text-amber-500 mb-1">
                {isLoadingStats ? "..." : stats.claimed}
              </span>
              <span className="text-xs text-slate-500">Undergoing verification</span>
            </div>

            {/* Stat Card 3 */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Successful Returns</span>
              <span className="text-4xl font-black text-emerald-500 mb-1">
                {isLoadingStats ? "..." : stats.returned}
              </span>
              <span className="text-xs text-slate-500">FinderNFTs minted &amp; rewarded</span>
            </div>

          </div>
        </div>
      </section>

      {/* Benefits and Recent Activity */}
      <section className="w-full py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Why PuneFinder Info */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <h3 className="text-2xl font-black text-white mb-6">
            How Decentrailzed Escrow Protects You
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-saffron/15 text-saffron">
                <Shield className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-slate-200">Tamper-Proof Escrow</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Rewards are locked in the open-source Ethereum virtual machine bytecode. Neither party can steal funds; payments release only upon confirmed owner match.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-bold text-slate-200">On-Chain Reputation (NFTs)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Honorable citizens who return items are rewarded with non-fungible return certificates. These certificates serve as verifiable badges of community trust.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center justify-between">
              Recent Activity Feed
              {!account && <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-medium">Demo Mode</span>}
            </h3>
            
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        act.type === "post" ? "bg-rose-500" : act.type === "claim" ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      {act.title} &bull; {act.location}
                    </span>
                    <span className="text-sm font-bold text-slate-200 truncate">
                      {act.description}
                    </span>
                    <span className="text-[10px] text-slate-500">{act.timestamp}</span>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs text-slate-400 font-semibold">Reward</span>
                    <span className="text-sm font-extrabold text-saffron">{act.reward} ETH</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link href="/items" className="inline-flex items-center gap-1 text-xs font-bold text-saffron hover:underline group">
                Browse all listings
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
