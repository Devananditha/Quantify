"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 20l4-16m2 16l4-16"/>
        <path d="M3 8h18M3 16h18"/>
      </svg>
    ),
  },
  {
    href: "/rewards",
    label: "Rewards",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    href: "/redeem",
    label: "Redeem",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ── MOBILE: Bottom Nav Bar ─────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 hidden max-sm:flex items-center justify-around bg-white/80 backdrop-blur-xl border-t border-cyan-100 shadow-[0_-4px_24px_rgba(14,165,233,0.12)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[60px] transition-all ${
                isActive ? "text-[#0284C7]" : "text-slate-400"
              }`}
            >
              <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>{item.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Hamburger Menu Button (always visible, same as original) ── */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-8 left-8 z-40 p-2.5 bg-white/60 backdrop-blur-xl rounded-xl shadow-[0_4px_16px_rgba(14,165,233,0.15)] border border-white/80 text-[#08172c] hover:bg-white hover:shadow-[0_4px_20px_rgba(14,165,233,0.25)] transition-all"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#08172c]/30 backdrop-blur-[2px] z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ── DESKTOP: Sidebar Drawer ────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-[100dvh] w-[260px] shrink-0 flex flex-col py-6 overflow-hidden bg-gradient-to-b from-[#e0f7fa]/90 via-[#bae6fd]/80 to-[#38bdf8]/80 backdrop-blur-3xl border-r border-white/50 text-[#08172c] shadow-[4px_0_32px_rgba(14,165,233,0.35)] z-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: '4px 0 32px rgba(14,165,233,0.2), inset -1px 0 0 rgba(255,255,255,0.4)' }}
      >
        {/* Close Button inside Sidebar */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-4 p-2 rounded-lg text-[#08172c]/60 hover:text-[#08172c] hover:bg-white/30 transition-all"
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#0F1E36" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="#0F1E36" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <path d="M2 12l10 5 10-5" stroke="#0F1E36" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
          </svg>
        </div>
        <span className={styles.logoText}>Menu</span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <p className={styles.navSection}>MENU</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all relative ${
                isActive
                  ? "bg-white/40 shadow-sm rounded-r-xl"
                  : "text-[#08172c]/80 hover:bg-white/10"
              }`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#08172c] rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* User Profile with Dropdown */}
      <UserProfile />
    </aside>
    </>
  );
}

function UserProfile() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const menuItems = [
    {
      label: "User Profile",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      ),
    },
    {
      label: "Settings",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
    {
      label: "Sign Out",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      ),
      danger: true,
    },
  ];

  return (
    <div ref={ref} className="relative px-4 pb-4 pt-2">
      {/* Dropdown Menu — pops upward */}
      {open && (
        <div className="absolute bottom-[calc(100%+4px)] left-4 right-4 rounded-2xl overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_-15px_rgba(6,182,212,0.35)] z-50 animate-fade-in-up">
          {/* User info header inside dropdown */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/50">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#bae6fd] to-[#38bdf8] p-[2px] shadow-[0_0_12px_rgba(56,189,248,0.5)]">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <Image src="/avatar.png" alt="User" width={40} height={40} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm"></span>
            </div>
            <div>
              <p className="text-[#08172c] text-sm font-bold leading-tight">User 1</p>
              <p className="text-slate-500 text-xs">user1@example.com</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/60 ${
                  item.danger ? "text-rose-600 hover:text-rose-700" : "text-[#08172c] hover:text-[#0891b2]"
                }`}
              >
                <span className="opacity-70">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#bae6fd]/70 to-[#7dd3fc]/60 backdrop-blur-md border border-[#38bdf8]/40 shadow-[0_4px_16px_rgba(56,189,248,0.2)] hover:from-[#bae6fd]/90 hover:to-[#7dd3fc]/80 transition-all group"
      >
        {/* Avatar with online indicator + light blue gradient ring */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#bae6fd] to-[#38bdf8] p-[2px] shadow-[0_4px_12px_rgba(56,189,248,0.45)]">
            <div className="w-full h-full rounded-full overflow-hidden">
              <Image src="/avatar.png" alt="User" width={36} height={36} className="w-full h-full object-cover" />
            </div>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm"></span>
        </div>

        {/* Name & email */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-[#08172c] text-sm font-bold leading-tight truncate">User 1</p>
          <p className="text-[#08172c]/60 text-[11px] truncate">user1@example.com</p>
        </div>

        {/* Chevron that rotates on open */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`text-[#08172c]/50 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
    </div>
  );
}
