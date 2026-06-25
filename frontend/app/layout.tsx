import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { EventProvider } from "@/context/EventContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotificationToast from "@/components/NotificationToast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap"
});

export const metadata: Metadata = {
  title: "PuneFinder — Hyperlocal Decentralized Lost & Found",
  description: "Report lost items, claim found matches, and reward finders securely through smart contract escrows on the Stellar network.",
  keywords: ["Pune", "Lost and Found", "dApp", "Stellar", "Soroban", "Web3", "PuneFinder"],
  authors: [{ name: "PuneFinder Team" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-[#060919] text-slate-100 antialiased">
        <WalletProvider>
          <EventProvider>
            <Navbar />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
            <NotificationToast />
          </EventProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
