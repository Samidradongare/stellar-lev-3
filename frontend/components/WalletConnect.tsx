"use client";

import React, { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { Wallet, LogOut, ChevronDown, Check } from "lucide-react";

export const WalletConnect: React.FC = () => {
  const {
    account,
    balance,
    isConnecting,
    connectWallet,
    disconnectWallet,
    networkError
  } = useWallet();

  const [showDropdown, setShowDropdown] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-deep-blue/40 border border-deep-blue text-white font-medium cursor-not-allowed opacity-80"
        id="wallet-connect-btn"
      >
        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
        Connecting...
      </button>
    );
  }

  if (account) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-deep-blue/20 hover:bg-deep-blue/30 border border-deep-blue/40 text-white font-medium transition-all cursor-pointer"
          id="wallet-connect-btn"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline text-slate-300 text-sm mr-1">
            {(parseInt(balance) / 10000000).toFixed(4)} XLM
          </span>
          <span className="text-sm border-l border-white/10 pl-2 sm:pl-3">
            {formatAddress(account)}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)} 
            />
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/15 bg-dark-card p-2 shadow-2xl z-20 backdrop-blur-md">
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-xs text-slate-400 font-normal">Connected Wallet</p>
                <p className="text-sm font-semibold truncate text-slate-100">{account}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  Stellar Testnet
                </div>
              </div>
              <button
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                }}
                className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer font-medium"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-light hover:to-saffron text-white font-semibold shadow-[0_4px_20px_rgba(255,107,0,0.35)] hover:shadow-[0_4px_25px_rgba(255,107,0,0.5)] active:scale-[0.98] transition-all cursor-pointer"
        id="wallet-connect-btn"
      >
        <Wallet className="w-4 h-4" />
        Connect Freighter
      </button>
      {networkError && (
        <p className="absolute right-0 mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/30 px-3 py-1.5 rounded-lg max-w-xs shadow-lg animate-fade-in z-30">
          {networkError}
        </p>
      )}
    </div>
  );
};

export default WalletConnect;
