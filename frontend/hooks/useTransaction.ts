"use client";

import { useState } from "react";
import { useEvents } from "../context/EventContext";
import { useWallet } from "../context/WalletContext";

interface TxOptions {
  pendingMessage: string;
  successMessage: string;
  errorMessage: string;
  onSuccess?: (receipt: any) => void;
  triggerConfetti?: boolean;
}

export function useTransaction() {
  const { addToast, triggerConfetti } = useEvents();
  const [isPending, setIsPending] = useState(false);

  const execute = async (
    txPromise: Promise<any>,
    options: TxOptions
  ): Promise<any> => {
    setIsPending(true);
    
    // 1. Create a unique toast ID for tracking
    const toastId = Math.random().toString(36).substr(2, 9);
    
    // Add initial pending toast
    addToast({
      type: "info",
      title: "Transaction Initiated",
      message: options.pendingMessage
    });

    try {
      // Wait for wallet signature and transaction submission
      const txHash = await txPromise;

      // Confirmed!
      addToast({
        type: "success",
        title: "Transaction Confirmed!",
        message: options.successMessage,
        txHash: txHash
      });

      if (options.triggerConfetti) {
        triggerConfetti();
      }

      if (options.onSuccess) {
        options.onSuccess(txHash);
      }

      setIsPending(false);
      return txHash;
    } catch (err: any) {
      console.error("Transaction failed:", err);
      
      // Parse a user-friendly error message
      let friendlyMessage = options.errorMessage;
      
      if (err.message && err.message.includes("User declined")) {
        friendlyMessage = "Transaction rejected by user in Freighter.";
      } else if (err.message && err.message.includes("Caller is not the item owner")) {
        friendlyMessage = "Failed: Only the item creator is authorized to perform this action.";
      } else if (err.message && err.message.includes("Reward amount must be greater than 0")) {
        friendlyMessage = "Failed: Reward amount must be greater than 0 XLM.";
      } else if (err.reason) {
        friendlyMessage = `Failed: ${err.reason}`;
      } else if (err.data?.message) {
        friendlyMessage = `Failed: ${err.data.message}`;
      }

      addToast({
        type: "error",
        title: "Transaction Failed",
        message: friendlyMessage
      });

      setIsPending(false);
      throw err;
    }
  };

  return { execute, isPending };
}

export default useTransaction;
