"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: bigint | null;
  balance: string;
  isConnecting: boolean;
  networkError: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const SUPPORTED_CHAINS = {
  LOCALHOST: {
    chainId: "0x539", // 1337
    chainName: "Hardhat Localhost",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: { name: "GO", symbol: "GO", decimals: 18 }
  },
  AMOY: {
    chainId: "0x13882", // 80002
    chainName: "Polygon Amoy Testnet",
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    blockExplorerUrls: ["https://amoy.polygonscan.com"]
  },
  MUMBAI: {
    chainId: "0x13881", // 80001
    chainName: "Polygon Mumbai Testnet",
    rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    blockExplorerUrls: ["https://mumbai.polygonscan.com"]
  }
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (addr: string, prov: ethers.BrowserProvider) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  }, []);

  const handleChainChanged = useCallback((chainHex: any) => {
    // Reload page as recommended by MetaMask docs
    window.location.reload();
  }, []);

  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      // Disconnected
      setAccount(null);
      setSigner(null);
      setProvider(null);
      setBalance("0");
    } else {
      setAccount(accounts[0]);
      if (typeof window !== "undefined" && window.ethereum) {
        const prov = new ethers.BrowserProvider(window.ethereum as any);
        const sig = await prov.getSigner();
        setProvider(prov);
        setSigner(sig);
        await fetchBalance(accounts[0], prov);
      }
    }
  }, [fetchBalance]);

  const checkWalletConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      const prov = new ethers.BrowserProvider(window.ethereum as any);
      const accounts = await prov.listAccounts();
      
      if (accounts.length > 0) {
        const net = await prov.getNetwork();
        setChainId(net.chainId);
        
        const sig = await prov.getSigner();
        setAccount(accounts[0].address);
        setProvider(prov);
        setSigner(sig);
        await fetchBalance(accounts[0].address, prov);
        
        // Listeners
        const eth = window.ethereum as any;
        eth.on("accountsChanged", handleAccountsChanged);
        eth.on("chainChanged", handleChainChanged);
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
    }
  }, [fetchBalance, handleAccountsChanged, handleChainChanged]);

  useEffect(() => {
    checkWalletConnection();
    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        const eth = window.ethereum as any;
        eth.removeListener("accountsChanged", handleAccountsChanged);
        eth.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [checkWalletConnection, handleAccountsChanged, handleChainChanged]);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setNetworkError("MetaMask not found. Please install MetaMask extension!");
      return;
    }

    setIsConnecting(true);
    setNetworkError(null);

    try {
      const prov = new ethers.BrowserProvider(window.ethereum as any);
      const accounts = await prov.send("eth_requestAccounts", []);
      
      const net = await prov.getNetwork();
      setChainId(net.chainId);
      
      const sig = await prov.getSigner();
      setAccount(accounts[0]);
      setProvider(prov);
      setSigner(sig);
      await fetchBalance(accounts[0], prov);

      // Listeners
      const eth = window.ethereum as any;
      eth.on("accountsChanged", handleAccountsChanged);
      eth.on("chainChanged", handleChainChanged);
    } catch (err: any) {
      console.error("User denied account access", err);
      setNetworkError(err?.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setBalance("0");
    setChainId(null);
    setNetworkError(null);
  };

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    
    // Default to Amoy for testnet, or Localhost if currently developing
    const targetChain = SUPPORTED_CHAINS.LOCALHOST; // Default local dev helper
    
    try {
      await (window.ethereum as any).request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChain.chainId }]
      });
    } catch (switchError: any) {
      // Code 4902 indicates that the chain was not added yet
      if (switchError.code === 4902) {
        try {
          await (window.ethereum as any).request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChain.chainId,
                chainName: targetChain.chainName,
                rpcUrls: targetChain.rpcUrls,
                nativeCurrency: targetChain.nativeCurrency,
              }
            ]
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      } else {
        console.error("Error switching network:", switchError);
      }
    }
  };

  // Check if chain matches localhost (1337 / 0x539) or Amoy (80002 / 0x13882) or Mumbai (80001 / 0x13881)
  const isCorrectNetwork = chainId !== null && (
    chainId === 1337n || 
    chainId === 80002n || 
    chainId === 80001n ||
    chainId === 31337n // Hardhat Node default chain ID
  );

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        chainId,
        balance,
        isConnecting,
        networkError,
        connectWallet,
        disconnectWallet,
        isCorrectNetwork,
        switchNetwork
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
