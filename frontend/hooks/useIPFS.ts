"use client";

import { useState } from "react";

// In-memory cache fallback just in case localStorage is disabled or fails
const mockIPFSCache: Record<string, string> = {};

export function useIPFS() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadToIPFS = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadError(null);

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataSecretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    // Check if Pinata keys are configured, otherwise use mock upload
    if (!pinataApiKey || !pinataSecretKey) {
      console.log("Pinata keys not configured. Falling back to local mock IPFS storage.");
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const base64Data = reader.result as string;
            const mockCID = `ipfs://mock-${Math.random().toString(36).substring(2, 15)}`;
            
            // Store base64 data in localStorage and in-memory cache
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(mockCID, base64Data);
              } catch (e) {
                console.warn("Storage quota exceeded, storing in memory only.");
              }
            }
            mockIPFSCache[mockCID] = base64Data;
            
            setTimeout(() => {
              setIsUploading(false);
              resolve(mockCID);
            }, 1000); // Simulate network delay
          } catch (err: any) {
            setIsUploading(false);
            setUploadError("Mock upload failed: " + err.message);
            reject(err);
          }
        };
        reader.onerror = () => {
          setIsUploading(false);
          setUploadError("Failed to read file.");
          reject(new Error("File read error"));
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const metadata = JSON.stringify({
        name: `punefinder-${Date.now()}`
      });
      formData.append("pinataMetadata", metadata);

      const options = JSON.stringify({
        cidVersion: 0
      });
      formData.append("pinataOptions", options);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Pinata upload failed with status ${response.status}`);
      }

      const data = await response.json();
      setIsUploading(false);
      return `ipfs://${data.IpfsHash}`;
    } catch (err: any) {
      console.error("IPFS Upload Error:", err);
      setUploadError(err.message || "Failed to upload image to IPFS");
      setIsUploading(false);
      throw err;
    }
  };

  return { uploadToIPFS, isUploading, uploadError };
}

// Global utility helper to resolve IPFS URLs
export function resolveIPFS(ipfsUrl: string | undefined): string {
  if (!ipfsUrl) return "/placeholder-item.jpg"; // Default placeholder if empty
  
  if (ipfsUrl.startsWith("data:")) {
    return ipfsUrl;
  }
  
  if (ipfsUrl.startsWith("ipfs://mock-")) {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ipfsUrl);
      if (stored) return stored;
    }
    return mockIPFSCache[ipfsUrl] || "/placeholder-item.jpg";
  }

  if (ipfsUrl.startsWith("ipfs://")) {
    const hash = ipfsUrl.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${hash}`;
  }

  return ipfsUrl;
}
