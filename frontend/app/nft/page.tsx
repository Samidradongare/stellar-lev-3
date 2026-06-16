"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { getFinderNFTContract } from "@/lib/contractHelpers";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Award, ShieldAlert, Calendar, MapPin, Eye, ExternalLink } from "lucide-react";

interface CertificateType {
  tokenId: string;
  itemId: string;
  finderAddress: string;
  itemDescription: string;
  returnDate: string;
  puneLocation: string;
}

export default function NFTGallery() {
  const { account, provider, isCorrectNetwork, connectWallet } = useWallet();
  const [nfts, setNfts] = useState<CertificateType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNFTs = async () => {
    if (!provider || !account || !isCorrectNetwork) return;
    setIsLoading(true);
    try {
      const contract = getFinderNFTContract(provider);
      if (!contract) return;

      // Filter events where the connected user is the finder
      const filter = contract.filters.CertificateMinted(account);
      const events = await contract.queryFilter(filter);

      const list: CertificateType[] = [];
      for (const event of events) {
        // TypeScript safe args access in Ethers v6
        const args = (event as any).args;
        if (!args) continue;

        const tokenId = args.tokenId.toString();
        const itemId = args.itemId.toString();
        
        try {
          const tokenURI = await contract.tokenURI(args.tokenId);
          
          // Parse the data URI JSON
          if (tokenURI.startsWith("data:application/json;utf8,")) {
            const rawJson = tokenURI.replace("data:application/json;utf8,", "");
            const metadata = JSON.parse(rawJson);
            
            list.push({
              tokenId,
              itemId,
              finderAddress: metadata.finderAddress,
              itemDescription: metadata.itemDescription,
              returnDate: new Date(Number(metadata.returnDate) * 1000).toLocaleDateString(),
              puneLocation: metadata.puneLocation
            });
          }
        } catch (parseErr) {
          console.error(`Error parsing metadata for NFT token ${tokenId}:`, parseErr);
        }
      }

      setNfts(list);
    } catch (err) {
      console.error("Error reading NFT logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider && account && isCorrectNetwork) {
      fetchNFTs();
    } else {
      // Mock NFT for disconnected demo mode
      setNfts([
        {
          tokenId: "1",
          itemId: "3",
          finderAddress: "0x9876543210987654321098765432109876543210",
          itemDescription: "Hyundai Verna Keys (Silicone Blue Cover)",
          returnDate: "Jun 12, 2026",
          puneLocation: "Kothrud"
        }
      ]);
    }
  }, [provider, account, isCorrectNetwork]);

  // State: Wallet Disconnected
  if (!account) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Wallet Disconnected</h2>
          <p className="text-sm text-slate-400 mb-6">
            Please connect your wallet to access your earned FinderNFT certificates.
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
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-8">
        <div className="flex items-center gap-2">
          <Award className="w-7 h-7 text-saffron" />
          <div>
            <h1 className="text-2xl font-black text-white">FinderNFT Certificates</h1>
            <p className="text-xs text-slate-400">Verifiable non-fungible badges of honor for returning lost items.</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div
              key={nft.tokenId}
              className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col h-full hover:border-saffron/30 transition-all relative overflow-hidden group shadow-lg"
            >
              {/* Saffron accent corner glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-saffron/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <span className="text-xs font-semibold text-saffron flex items-center gap-1">
                  <Award className="w-4 h-4 animate-pulse" />
                  Certificate #{nft.tokenId}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">TokenID: {nft.tokenId}</span>
              </div>

              {/* Graphic Placeholder resembling an certificate */}
              <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-deep-blue/80 to-dark-bg border border-deep-blue flex flex-col justify-between p-4 relative mb-6">
                
                {/* Logo and Watermark */}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-extrabold tracking-tight text-white flex items-center gap-0.5">
                    <span className="text-saffron">P</span>F
                  </div>
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 font-mono">Polygon Escrow Verified</span>
                </div>

                <div className="text-center my-auto space-y-1">
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Finder Certificate</h4>
                  <p className="text-xs font-bold text-slate-100 truncate max-w-[180px] mx-auto">
                    {nft.itemDescription}
                  </p>
                  <p className="text-[8px] font-mono text-emerald-400">Finder: {nft.finderAddress.slice(0, 8)}...{nft.finderAddress.slice(-6)}</p>
                </div>

                <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono">
                  <span>LOC: {nft.puneLocation}</span>
                  <span>{nft.returnDate}</span>
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <div className="text-xs space-y-1 bg-black/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location returned:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-saffron" />
                      {nft.puneLocation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Verification date:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {nft.returnDate}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href={`/items/${nft.itemId}`}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-deep-blue/40 hover:bg-deep-blue/60 border border-deep-blue text-[10px] font-bold text-white transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Item
                  </Link>
                  <a
                    href={isCorrectNetwork && (Number(nft.itemId) > 0) ? `https://amoy.polygonscan.com/token/${CONTRACT_ADDRESSES.FinderNFT}?a=${nft.tokenId}` : `#`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Polygonscan
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-16">
          <Award className="w-16 h-16 text-slate-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No Certificates Earned Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mb-6">
            Certificates are automatically minted for finders when owners verify claims. Report finding lost items to start earning certificates!
          </p>
          <Link
            href="/items"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-saffron hover:bg-saffron-dark text-white font-bold transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)] cursor-pointer"
          >
            Browse Registry
          </Link>
        </div>
      )}
    </div>
  );
}
