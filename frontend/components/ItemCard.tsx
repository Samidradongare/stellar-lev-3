"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Coins, Calendar } from "lucide-react";
import { resolveIPFS } from "../hooks/useIPFS";

export interface ItemType {
  id: bigint;
  owner: string;
  description: string;
  photoIPFS: string;
  reward: bigint;
  status: number; // 0: Lost, 1: Claimed, 2: Verified, 3: Completed
  timestamp: bigint;
  location: string;
}

interface ItemCardProps {
  item: ItemType;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const formattedReward = (Number(item.reward) / 10000000).toFixed(4); // Format stroops to XLM
  const dateStr = new Date(Number(item.timestamp) * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const getStatusDetails = (status: number) => {
    switch (status) {
      case 0:
        return { text: "Lost", bg: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
      case 1:
        return { text: "Claimed", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      case 2:
        return { text: "Verified", bg: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
      case 3:
        return { text: "Completed", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
      default:
        return { text: "Unknown", bg: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
    }
  };

  const statusStyle = getStatusDetails(item.status);

  return (
    <Link href={`/items/${item.id}`} className="group block h-full">
      <div className="glass-panel glass-panel-hover flex flex-col h-full rounded-2xl overflow-hidden border border-white/5 relative">
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusStyle.bg}`}>
            {statusStyle.text}
          </span>
        </div>

        {/* Item Image */}
        <div className="w-full aspect-video bg-slate-900/50 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveIPFS(item.photoIPFS)}
            alt={item.description}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-item.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-transparent to-transparent opacity-80" />
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Location and Date */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-saffron" />
              {item.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {dateStr}
            </span>
          </div>

          {/* Description */}
          <h3 className="text-base font-bold text-slate-100 line-clamp-2 mb-4 group-hover:text-saffron transition-colors">
            {item.description}
          </h3>

          {/* Reward and Link Action */}
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Reward Pool</span>
              <span className="flex items-center gap-1 text-base font-extrabold text-saffron">
                <Coins className="w-4 h-4" />
                {formattedReward} XLM
              </span>
            </div>
            
            <span className="text-xs font-bold text-deep-blue-light group-hover:text-saffron group-hover:translate-x-1 transition-all duration-300">
              View Details &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
