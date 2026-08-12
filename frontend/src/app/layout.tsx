import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Doto, Outfit } from "next/font/google";
import "@/app/globals.css";
import { Sidebar } from "@/components/Sidebar";
import styles from "./RootLayout.module.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
  display: "swap",
  axes: ["ROND"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dash — Rewards Dashboard",
  description:
    "Track transactions, manage rewards, and redeem coins on your personal financial dashboard.",
  keywords: ["rewards", "transactions", "coins", "dashboard", "finance"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${doto.variable} ${outfit.variable}`}
    >
      <body className="text-[#08172c] relative z-0 min-h-screen">
        {/* ── Layer 1: Rich deep blue base ── */}
        <div className="fixed inset-0 z-[-5]" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 25%, #7dd3fc 50%, #bae6fd 75%, #e0f7fa 100%)' }}></div>
        {/* ── Layer 2: Stacked radial glow blobs — different blue intensities ── */}
        <div className="fixed inset-0 z-[-4]" style={{ background: 'radial-gradient(ellipse 70% 60% at 0% 0%, rgba(14,165,233,0.85) 0%, transparent 55%)' }}></div>
        <div className="fixed inset-0 z-[-4]" style={{ background: 'radial-gradient(ellipse 50% 50% at 100% 0%, rgba(56,189,248,0.7) 0%, transparent 50%)' }}></div>
        <div className="fixed inset-0 z-[-4]" style={{ background: 'radial-gradient(ellipse 60% 50% at 100% 80%, rgba(2,132,199,0.5) 0%, transparent 55%)' }}></div>
        <div className="fixed inset-0 z-[-4]" style={{ background: 'radial-gradient(ellipse 50% 40% at 30% 100%, rgba(125,211,252,0.6) 0%, transparent 50%)' }}></div>
        {/* ── Layer 3: Central fade-to-white for legibility ── */}
        <div className="fixed inset-0 z-[-3]" style={{ background: 'radial-gradient(ellipse 80% 80% at 55% 50%, rgba(240,253,255,0.55) 0%, transparent 70%)' }}></div>
        {/* ── Layer 4: Subtle dot grid ── */}
        <div className="fixed inset-0 z-[-2] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '26px 26px' }}></div>
        <div className={styles.shell}>
          <Sidebar />
          <main 
            className="min-h-screen flex-1 pt-20 pb-24 px-4 sm:pt-8 sm:pb-8 sm:px-6 lg:pl-[100px] lg:pr-[100px] overflow-x-hidden flex justify-center"
            style={{
              backgroundColor: "#f0fbff",
              backgroundImage: "radial-gradient(circle at 0% 0%, rgba(132, 230, 248, 0.4) 0%, transparent 40%), radial-gradient(circle at 80% 10%, rgba(132, 230, 248, 0.3) 0%, transparent 40%), radial-gradient(circle at 100% 60%, rgba(132, 230, 248, 0.4) 0%, transparent 50%), radial-gradient(#94a3b8 1px, transparent 1px)",
              backgroundSize: "100% 100%, 100% 100%, 100% 100%, 24px 24px"
            }}
          >
            <div className="w-full max-w-[1400px]">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
