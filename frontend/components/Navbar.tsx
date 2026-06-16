"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Menu, X, PlusCircle, Search, LayoutDashboard, Award } from "lucide-react";
import WalletConnect from "./WalletConnect";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/items", label: "Lost Items", icon: Search },
    { href: "/post", label: "Report Lost", icon: PlusCircle },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/nft", label: "Certificates", icon: Award }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="p-2 rounded-xl bg-gradient-to-br from-saffron to-saffron-dark text-white shadow-[0_0_15px_rgba(255,107,0,0.3)]">
                <MapPin className="w-5 h-5 group-hover:animate-bounce" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                <span className="text-saffron">Pune</span>
                <span className="text-white">Finder</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                    isActive(link.href)
                      ? "text-saffron bg-saffron/5"
                      : "text-slate-300 hover:text-saffron hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:block">
            <WalletConnect />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-white/5 px-4 pt-2 pb-4 space-y-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive(link.href)
                    ? "text-saffron bg-saffron/10 font-semibold"
                    : "text-slate-300 hover:text-saffron hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          
          <div className="pt-4 border-t border-white/5">
            <WalletConnect />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
