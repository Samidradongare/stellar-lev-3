"use client";

import React from "react";
import { Heart, MapPin } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-[#060919]/80 backdrop-blur-md mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Branding & Location */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-sm font-extrabold text-slate-200">
            <span className="text-saffron">Pune</span>Finder
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-saffron/10 border border-saffron/20 text-saffron">
              Hyperlocal dApp
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Decentralized Lost &amp; Found Platform for Pune, MH, India.
          </p>
        </div>

        {/* Pune Callout */}
        <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
          Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" /> for the people of Pune
          <MapPin className="w-3.5 h-3.5 text-saffron" />
        </div>

        {/* GitHub / Tech Stack Notes */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-saffron transition-colors"
            title="View Code on GitHub"
          >
            <GithubIcon className="w-5 h-5" />
          </a>
          <span className="text-xs text-slate-500">
            Stellar Soroban &bull; Rust &bull; Next.js 14
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
