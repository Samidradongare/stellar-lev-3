"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function FinderNFT() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-saffron transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back Home
      </Link>
      
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="w-16 h-16 text-saffron mb-6" />
        <h1 className="text-3xl font-black text-white mb-4">Finder Certificates on Stellar</h1>
        <p className="text-slate-400 max-w-lg mb-8">
          The Finder NFT functionality is currently being rebuilt as Stellar Assets (or Soroban Tokens). 
          Check back soon to claim your verifiable on-chain certificates!
        </p>
        <Link
          href="/items"
          className="px-6 py-3 rounded-xl bg-saffron hover:bg-saffron-dark text-white font-bold transition-all"
        >
          Browse Lost Items
        </Link>
      </div>
    </div>
  );
}
