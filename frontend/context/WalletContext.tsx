"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { Horizon } from "@stellar/stellar-sdk";

interface WalletContextType {
  account: string | null;
  balance: string;
  isConnecting: boolean;
  networkError: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      // Connecting to Stellar Testnet to fetch balance
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const accountData = await server.loadAccount(addr);
      
      const nativeBalance = accountData.balances.find(
        (b: any) => b.asset_type === "native"
      );
      
      if (nativeBalance) {
        setBalance(nativeBalance.balance);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, []);

  const checkWalletConnection = useCallback(async () => {
    try {
      const connected = await isConnected();
      if (connected) {
        const accessResult = await requestAccess();
        if (accessResult.address) {
          setAccount(accessResult.address);
          await fetchBalance(accessResult.address);
        }
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    }
  }, [fetchBalance]);

  useEffect(() => {
    checkWalletConnection();
  }, [checkWalletConnection]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setNetworkError(null);

    try {
      const connected = await isConnected();
      if (!connected) {
        setNetworkError("Freighter not found. Please install Freighter extension!");
        setIsConnecting(false);
        return;
      }

      const accessResult = await requestAccess();
      if (accessResult.address) {
        setAccount(accessResult.address);
        await fetchBalance(accessResult.address);
      } else if (accessResult.error) {
        setNetworkError(accessResult.error.toString());
      }
      setIsConnecting(false);
    } catch (err) {
      console.error("Connection error:", err);
      setNetworkError("Failed to connect wallet. Check Freighter popup.");
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance("0");
    setNetworkError(null);
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        balance,
        isConnecting,
        networkError,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
