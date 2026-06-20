"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { getLostAndFoundContract } from "@/lib/contractHelpers";
import { PUNE_LOCATIONS } from "@/lib/constants";
import ItemCard, { ItemType } from "@/components/ItemCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Search as SearchIcon, MapPin, SlidersHorizontal, RefreshCw, Archive } from "lucide-react";

export default function Items() {
  const { provider, isCorrectNetwork } = useWallet();
  const [items, setItems] = useState<ItemType[]>([]);
  const [filteredItems, setFilteredItems] = useState<ItemType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All"); // All, Lost (0), Claimed (1), Verified (2), Completed (3)

  const fetchItems = async () => {
    if (!provider || !isCorrectNetwork) return;
    setIsLoading(true);
    try {
      const contract = getLostAndFoundContract(provider);
      if (!contract) return;

      const fetchedListings: ItemType[] = [];
      const totalItemsBigInt = await contract.getTotalItems();
      const totalItems = Number(totalItemsBigInt);
      
      for (let id = 1; id <= totalItems; id++) {
        try {
          const rawItem = await contract.getItem(id);
          fetchedListings.push({
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
          console.error(`Error fetching item ${id}:`, err);
        }
      }

      // Sort newest first
      fetchedListings.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      setItems(fetchedListings);
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (provider && isCorrectNetwork) {
      fetchItems();

      const contract = getLostAndFoundContract(provider);
      if (contract) {
        const handleEvent = () => fetchItems();
        
        contract.on("ItemPosted", handleEvent);
        contract.on("ClaimSubmitted", handleEvent);
        contract.on("ClaimVerified", handleEvent);
        contract.on("ClaimRejected", handleEvent);

        return () => {
          contract.off("ItemPosted", handleEvent);
          contract.off("ClaimSubmitted", handleEvent);
          contract.off("ClaimVerified", handleEvent);
          contract.off("ClaimRejected", handleEvent);
        };
      }
    } else {
      // Mock items for disconnected demo mode
      setItems([
        {
          id: 1n,
          owner: "0x1234567890123456789012345678901234567890",
          description: "Black leather wallet containing Aadhaar card, driving license and credit cards.",
          photoIPFS: "ipfs://mock-wallet",
          reward: 20000000000000000n, // 0.02 ETH
          status: 0, // Lost
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600),
          location: "Koregaon Park"
        },
        {
          id: 2n,
          owner: "0x2345678901234567890123456789012345678901",
          description: "Dell Latitude laptop left in a cafe with a silver stickers on the shell.",
          photoIPFS: "ipfs://mock-laptop",
          reward: 250000000000000000n, // 0.25 ETH
          status: 1, // Claimed
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 7200),
          location: "Baner"
        },
        {
          id: 3n,
          owner: "0x3456789012345678901234567890123456789012",
          description: "Car Keys for a Hyundai Verna, has a blue silicone key cover.",
          photoIPFS: "ipfs://mock-keys",
          reward: 10000000000000000n, // 0.01 ETH
          status: 2, // Verified (Returned)
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
          location: "Kothrud"
        }
      ]);
    }
  }, [provider, isCorrectNetwork]);

  // Handle Filtering
  useEffect(() => {
    let result = [...items];

    // 1. Filter by Search Description
    if (searchTerm.trim() !== "") {
      result = result.filter((item) =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Filter by Location
    if (selectedLocation !== "All") {
      result = result.filter((item) => item.location === selectedLocation);
    }

    // 3. Filter by Status
    if (selectedStatus !== "All") {
      const statusNum = parseInt(selectedStatus);
      result = result.filter((item) => item.status === statusNum);
    }

    setFilteredItems(result);
  }, [items, searchTerm, selectedLocation, selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            Lost &amp; Found Registry
            {provider && isCorrectNetwork && (
              <button
                onClick={fetchItems}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Refresh listings"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-saffron" : ""}`} />
              </button>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse items lost across Pune or check your matches. Filter by status or location.
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="glass-panel p-5 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search descriptions..."
            className="glass-input w-full p-2.5 pl-9 rounded-xl text-sm"
          />
          <SearchIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <MapPin className="w-4 h-4 text-saffron flex-shrink-0" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="glass-input w-full md:w-44 p-2.5 rounded-xl text-xs cursor-pointer"
          >
            <option value="All" className="bg-dark-bg text-white">All Locations</option>
            {PUNE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc} className="bg-dark-bg text-white">
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="glass-input w-full md:w-40 p-2.5 rounded-xl text-xs cursor-pointer"
          >
            <option value="All" className="bg-dark-bg text-white">All Statuses</option>
            <option value="0" className="bg-dark-bg text-white">Lost</option>
            <option value="1" className="bg-dark-bg text-white">Claimed</option>
            <option value="2" className="bg-dark-bg text-white">Verified</option>
            <option value="3" className="bg-dark-bg text-white">Completed (Refunded)</option>
          </select>
        </div>

      </div>

      {/* Grid Display */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id.toString()} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-16 px-4">
          <Archive className="w-12 h-12 text-slate-500 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-300">No Listings Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Try adjusting your search criteria or location filters, or post a new lost item!
          </p>
        </div>
      )}
    </div>
  );
}
