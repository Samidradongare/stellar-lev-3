"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "./WalletContext";
import { getLostAndFoundContract } from "../lib/contractHelpers";
import { ethers } from "ethers";
import confetti from "canvas-confetti";

export interface ToastNotification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  txHash?: string;
  itemId?: string;
  timestamp: Date;
}

interface EventContextType {
  notifications: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, "id" | "timestamp">) => void;
  removeToast: (id: string) => void;
  triggerConfetti: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, provider, chainId } = useWallet();
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      ...toast,
      id,
      timestamp: new Date()
    };
    setNotifications((prev) => [newToast, ...prev].slice(0, 10)); // Keep last 10
  };

  const removeToast = (id: string) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF6B00", "#1A237E", "#FFFFFF", "#FFD700"]
    });
  };

  useEffect(() => {
    if (!provider || !account || !chainId) return;

    try {
      const contract = getLostAndFoundContract(provider);
      if (!contract) return;

      console.log("Subscribing to contract events...");

      // 1. Listen for ClaimSubmitted
      const handleClaimSubmitted = async (
        claimId: any,
        itemId: any,
        claimant: string,
        proofIPFS: string,
        timestamp: any,
        event: any
      ) => {
        try {
          // Check if item owner is the current user
          const item = await contract.getItem(itemId);
          if (item.owner.toLowerCase() === account.toLowerCase()) {
            addToast({
              type: "warning",
              title: "New Claim Submitted!",
              message: `Someone claimed your lost item: "${item.description.slice(0, 30)}..."`,
              itemId: itemId.toString(),
              txHash: event.log.transactionHash
            });
          }
        } catch (err) {
          console.error("Error matching claim event owner:", err);
        }
      };

      // 2. Listen for ClaimVerified
      const handleClaimVerified = async (
        claimId: any,
        itemId: any,
        finder: string,
        reward: any,
        tokenId: any,
        event: any
      ) => {
        try {
          const item = await contract.getItem(itemId);
          const isFinder = finder.toLowerCase() === account.toLowerCase();
          const isOwner = item.owner.toLowerCase() === account.toLowerCase();

          if (isFinder) {
            triggerConfetti();
            addToast({
              type: "success",
              title: "Claim Approved!",
              message: `Your claim for "${item.description.slice(0, 30)}..." was verified! Reward of ${ethers.formatEther(reward)} ETH released.`,
              itemId: itemId.toString(),
              txHash: event.log.transactionHash
            });
          } else if (isOwner) {
            triggerConfetti();
            addToast({
              type: "success",
              title: "Item Returned Successfully!",
              message: `You verified the claim for "${item.description.slice(0, 30)}...". Certificate NFT minted to finder!`,
              itemId: itemId.toString(),
              txHash: event.log.transactionHash
            });
          }
        } catch (err) {
          console.error("Error matching claim verified event:", err);
        }
      };

      // 3. Listen for RewardReleased
      const handleRewardReleased = async (itemId: any, finder: string, amount: any, event: any) => {
        // Handled in tandem with verified, but can output info toast if needed.
      };

      // 4. Listen for ClaimRejected
      const handleClaimRejected = async (claimId: any, itemId: any, claimant: string, event: any) => {
        try {
          const item = await contract.getItem(itemId);
          const isClaimant = claimant.toLowerCase() === account.toLowerCase();
          const isOwner = item.owner.toLowerCase() === account.toLowerCase();

          if (isClaimant) {
            addToast({
              type: "error",
              title: "Claim Rejected",
              message: `Your claim for "${item.description.slice(0, 30)}..." was rejected by the owner.`,
              itemId: itemId.toString(),
              txHash: event.log.transactionHash
            });
          } else if (isOwner) {
            addToast({
              type: "info",
              title: "Claim Rejected & Refunded",
              message: `You rejected the claim for "${item.description.slice(0, 30)}...". Reward refunded to your wallet.`,
              itemId: itemId.toString(),
              txHash: event.log.transactionHash
            });
          }
        } catch (err) {
          console.error("Error matching claim rejected event:", err);
        }
      };

      // Register listeners
      contract.on(contract.filters.ClaimSubmitted, handleClaimSubmitted);
      contract.on(contract.filters.ClaimVerified, handleClaimVerified);
      contract.on(contract.filters.ClaimRejected, handleClaimRejected);

      return () => {
        console.log("Unsubscribing from contract events...");
        contract.off(contract.filters.ClaimSubmitted, handleClaimSubmitted);
        contract.off(contract.filters.ClaimVerified, handleClaimVerified);
        contract.off(contract.filters.ClaimRejected, handleClaimRejected);
      };
    } catch (err) {
      console.error("Error setting up event listeners:", err);
    }
  }, [provider, account, chainId]);

  return (
    <EventContext.Provider value={{ notifications, addToast, removeToast, triggerConfetti }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
};
