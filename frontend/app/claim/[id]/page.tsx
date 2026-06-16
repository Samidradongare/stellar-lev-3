"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { getLostAndFoundContract } from "@/lib/contractHelpers";
import { useTransaction } from "@/hooks/useTransaction";
import IPFSImageUpload from "@/components/IPFSImageUpload";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Send, ArrowLeft, Info, ShieldAlert, Sparkles } from "lucide-react";

export default function SubmitClaim({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const itemId = resolvedParams.id;
  const { account, signer, provider, isCorrectNetwork, connectWallet } = useWallet();
  const { execute, isPending } = useTransaction();
  const router = useRouter();

  // State
  const [item, setItem] = useState<any>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(true);
  const [proofIPFS, setProofIPFS] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!provider || !isCorrectNetwork) return;
      setIsLoadingItem(true);
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
      } catch (err) {
        console.error("Error fetching item for claim:", err);
      } finally {
        setIsLoadingItem(false);
      }
    };

    if (provider && isCorrectNetwork) {
      fetchItem();
    } else {
      // Mock item for disconnected preview
      if (itemId === "2") {
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
      }
      setIsLoadingItem(false);
    }
  }, [provider, isCorrectNetwork, itemId]);

  const handleUploadSuccess = (ipfsHash: string) => {
    setProofIPFS(ipfsHash);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!proofIPFS) {
      setValidationError("Please upload an image as proof of recovery.");
      return;
    }

    try {
      const contract = getLostAndFoundContract(signer);
      if (!contract) return;

      const txPromise = contract.submitClaim(Number(itemId), proofIPFS);
      
      await execute(txPromise, {
        pendingMessage: "Submitting found item claim. Please sign in MetaMask...",
        successMessage: "Claim submitted successfully! The owner will review your proof.",
        errorMessage: "Failed to submit found item claim.",
        onSuccess: () => {
          router.push(`/items/${itemId}`);
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
            You must connect your MetaMask wallet to report finding this item and submit a claim.
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
            Please switch your network configuration to Localhost or Polygon Amoy to interact with contracts.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingItem) {
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
            The item listing you are trying to claim does not exist.
          </p>
          <Link href="/items" className="text-saffron hover:underline text-sm font-bold flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to registry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 w-full">
      {/* Back Button */}
      <Link href={`/items/${itemId}`} className="inline-flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-saffron transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Details
      </Link>

      <div className="glass-panel p-8 rounded-2xl">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
          <Sparkles className="w-6 h-6 text-saffron" />
          <h1 className="text-2xl font-black text-white">Claim Found Item</h1>
        </div>

        {/* Item Summary */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 mb-8">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Item You Found</span>
          <p className="text-sm font-bold text-slate-200 mt-1">{item.description}</p>
          <div className="mt-2 text-xs text-slate-400">
            Location: <span className="text-slate-300 font-semibold">{item.location}</span>
          </div>
        </div>

        {validationError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitClaim} className="space-y-6">
          
          {/* IPFS Photo Upload */}
          <IPFSImageUpload
            onUploadSuccess={handleUploadSuccess}
            label="Upload Proof of Retrieval"
            required
          />

          {/* Alert Note */}
          <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 text-xs text-slate-400 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              Please upload a clear photograph of the found item (e.g. highlighting serial numbers, keychains, or specific features) to help the owner confirm you have it. The proof will be pinned on IPFS.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-saffron to-saffron-dark hover:from-saffron-light hover:to-saffron text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.35)] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? "Confirming Submission..." : "Submit Claim Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
