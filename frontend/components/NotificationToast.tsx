"use client";

import React from "react";
import { useEvents, ToastNotification } from "../context/EventContext";
import { X, CheckCircle, AlertCircle, Info, ExternalLink } from "lucide-react";
import { useWallet } from "../context/WalletContext";

export const NotificationToast: React.FC = () => {
  const { notifications, removeToast } = useEvents();
  const { chainId } = useWallet();

  const getExplorerLink = (txHash: string) => {
    if (chainId === 80002n) {
      return `https://amoy.polygonscan.com/tx/${txHash}`;
    }
    if (chainId === 80001n) {
      return `https://mumbai.polygonscan.com/tx/${txHash}`;
    }
    return `#`; // Local network, no explorer link
  };

  const getToastIcon = (type: ToastNotification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-dark-card/90 shadow-2xl backdrop-blur-md animate-slide-in"
          style={{
            animation: "slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getToastIcon(notif.type)}
          </div>
          
          <div className="flex-grow">
            <h4 className="text-sm font-bold text-slate-100">{notif.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
            {notif.txHash && (
              <div className="mt-2.5 flex items-center gap-1.5">
                {chainId === 1337n || chainId === 31337n ? (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Local Tx: {notif.txHash.substring(0, 10)}...
                  </span>
                ) : (
                  <a
                    href={getExplorerLink(notif.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-saffron hover:underline"
                  >
                    View on Polygonscan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => removeToast(notif.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      {/* Dynamic slide-in keyframe style block */}
      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
