"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { invokeContractFunction } from "@/lib/contractHelpers";
import { buildPostLostItemArgs, XLM_CONTRACT_ADDRESS } from "@/lib/abis";
import { PUNE_LOCATIONS } from "@/lib/constants";
import { useTransaction } from "@/hooks/useTransaction";
import IPFSImageUpload from "@/components/IPFSImageUpload";
import { PlusCircle, Info, ShieldAlert, Coins } from "lucide-react";

export default function PostItem() {
  const { account, connectWallet } = useWallet();
  const { execute, isPending } = useTransaction();
  const router = useRouter();

  // Form State
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(PUNE_LOCATIONS[0]);
  const [rewardAmount, setRewardAmount] = useState("");
  const [photoIPFS, setPhotoIPFS] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleUploadSuccess = (ipfsHash: string) => {
    setPhotoIPFS(ipfsHash);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Form Validations
    if (!description.trim()) {
      setValidationError("Please enter a description of the lost item.");
      return;
    }
    if (!location) {
      setValidationError("Please select a location.");
      return;
    }
    if (!rewardAmount || parseFloat(rewardAmount) <= 0) {
      setValidationError("Please specify an escrow reward greater than 0 XLM.");
      return;
    }
    if (!photoIPFS) {
      setValidationError("Please upload a photo of the lost item to IPFS.");
      return;
    }

    try {
      if (!account) return;

      // 1 XLM = 10,000,000 stroops
      const rewardInStroops = Math.floor(parseFloat(rewardAmount) * 10000000);

      // Arguments for post_lost_item
      const args = buildPostLostItemArgs(
        account,
        XLM_CONTRACT_ADDRESS,
        description,
        photoIPFS,
        location,
        BigInt(rewardInStroops)
      );

      const txPromise = invokeContractFunction(
        "post_lost_item",
        args,
        account
      );

      await execute(txPromise as any, {
        pendingMessage: "Initiating escrow lock. Please sign the transaction in Freighter...",
        successMessage: `Lost item listed successfully! Reward of ${rewardAmount} XLM locked in escrow.`,
        errorMessage: "Failed to post lost item listing.",
        onSuccess: () => {
          // Redirect to browse listings
          router.push("/items");
        }
      });
    } catch (err) {
      console.error(err);
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
            You must connect your Freighter wallet to lock reward escrows and list lost items.
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
    <div className="max-w-2xl mx-auto my-12 px-4 w-full">
      <div className="glass-panel p-8 rounded-2xl">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
          <PlusCircle className="w-6 h-6 text-saffron" />
          <h1 className="text-2xl font-black text-white">Report Lost Item</h1>
        </div>

        {validationError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Item Description <span className="text-saffron">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the item (e.g. Model, serial numbers, color, specific markings, keychains...)"
              rows={4}
              maxLength={400}
              className="glass-input w-full p-4 rounded-xl text-sm leading-relaxed resize-none"
              required
            />
          </div>

          {/* Location & Reward Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Hyperlocal Pune Location <span className="text-saffron">*</span>
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="glass-input w-full p-3 rounded-xl text-sm cursor-pointer"
              >
                {PUNE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="bg-dark-bg text-white">
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Reward */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Escrow Reward Amount (XLM) <span className="text-saffron">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  placeholder="e.g. 5.0"
                  className="glass-input w-full p-3 pl-10 rounded-xl text-sm"
                  required
                />
                <Coins className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* IPFS Photo Upload */}
          <IPFSImageUpload onUploadSuccess={handleUploadSuccess} required />

          {/* Informational Warning */}
          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 text-xs text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-saffron flex-shrink-0 mt-0.5" />
            <p>
              Your reward funds will be held in the smart contract's secure escrow account on the Stellar Network. They are locked safely and can only be transferred to a verified finder or refunded back to your wallet.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-light hover:to-saffron text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.35)] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? "Confirming Transaction..." : "Lock Escrow & List Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
