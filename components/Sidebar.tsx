"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import NewButton from "./NewButton";
import YarnMark from "./YarnMark";

type NavItem =
  | {
      kind: "link";
      label: string;
      icon: string;
      href: string;
      isActive: boolean;
    }
  | {
      kind: "accordion";
      label: string;
      icon: string;
      isOpen: boolean;
      onToggle: () => void;
      isActive: boolean;
      children: { label: string; href: string }[];
    };

export default function Sidebar() {
  const pathname = usePathname();

  // State Pengendali untuk mengontrol visibilitas masing-masing accordion menu
  const [isPrivateOpen, setIsPrivateOpen] = useState(pathname.startsWith("/private"));
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith("/settings"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Tutup menu laci otomatis saat rute berubah
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Daftar item navigasi: Menu tunggal untuk Dashboard, Notes, dan Public Files, serta Accordion untuk Private dan Settings
  const navItems: NavItem[] = [
    {
      kind: "link",
      label: "Dashboard",
      icon: "🏠",
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      kind: "link",
      label: "Notes",
      icon: "📝",
      href: "/notes",
      isActive: pathname.startsWith("/notes"),
    },
    {
      kind: "link",
      label: "Public Files",
      icon: "📎",
      href: "/files/documents",
      isActive: pathname.startsWith("/files"),
    },
    {
      kind: "accordion",
      label: "Private",
      icon: "🔒",
      isOpen: isPrivateOpen,
      onToggle: () => setIsPrivateOpen((prev) => !prev),
      isActive: pathname.startsWith("/private"),
      children: [
        { label: "Private Notes", href: "/private/notes" },
        { label: "Private Files", href: "/private/files" },
      ],
    },
    {
      kind: "accordion",
      label: "Settings",
      icon: "⚙️",
      isOpen: isSettingsOpen,
      onToggle: () => setIsSettingsOpen((prev) => !prev),
      isActive: pathname.startsWith("/settings"),
      children: [
        { label: "Account", href: "/settings/account" },
        { label: "Crypto Lab", href: "/settings/crypto-lab" },
      ],
    },
  ];

  // Sembunyikan Sidebar jika pengunjung sedang berada di Landing Page (/), /login, atau /register
  const hideSidebarRoutes = ["/", "/landing", "/login", "/register"];
  if (hideSidebarRoutes.includes(pathname)) {
    return null;
  }

  return (
    <>
      {/* Mobile Top Navbar sederhana dengan Hamburger Menu */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-moya-border bg-moya-surface/95 backdrop-blur-sm sticky top-0 z-30 w-full shrink-0 shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-2">
          <YarnMark size={22} />
          <span className="font-display text-lg text-moya-text tracking-wide">MOYA</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="p-2 rounded-xl text-moya-text hover:bg-moya-soft focus-ring transition-colors cursor-pointer"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Backdrop overlay saat menu laci mobile terbuka */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Menu slide-over (laci) di mobile & posisi permanen sticky di desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-moya-surface border-r border-moya-border
          flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out
          md:static md:w-64 md:inset-auto md:z-auto md:shadow-none md:flex md:sticky md:top-0 md:h-screen md:shrink-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="px-5 pt-5 md:pt-7 pb-3 overflow-y-auto">
          {/* Header Laci Mobile dengan Tombol Tutup */}
          <div className="flex md:hidden items-center justify-between pb-4 mb-4 border-b border-moya-border">
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <YarnMark size={24} />
              <span className="font-display text-xl text-moya-text">MOYA</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-moya-muted hover:text-moya-text hover:bg-moya-soft focus-ring cursor-pointer"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <Link href="/dashboard" className="hidden md:flex items-center gap-2 px-1 mb-1">
            <YarnMark size={26} />
            <span className="font-display text-xl text-moya-text">MOYA</span>
          </Link>
          <p className="hidden md:block text-xs text-moya-muted px-1 mb-7 tracking-wide">
            Make Own Yarns
          </p>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.kind === "link" ? (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[15px]
                      transition-colors focus-ring
                      ${
                        item.isActive
                          ? "bg-moya-soft text-moya-primarydark font-medium"
                          : "text-moya-text hover:bg-moya-bg"
                      }
                    `}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </div>
              ) : (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={item.onToggle}
                    aria-expanded={item.isOpen}
                    className={`
                      w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[15px]
                      transition-colors focus-ring text-left select-none
                      ${
                        item.isActive
                          ? "bg-moya-soft text-moya-primarydark font-medium"
                          : "text-moya-text hover:bg-moya-bg"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    <svg
                      className={`w-3.5 h-3.5 text-moya-muted transition-transform duration-200 ${
                        item.isOpen ? "rotate-90" : "rotate-0"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  {item.isOpen && (
                    <div className="ml-9 mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-moya-border pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            px-2.5 py-1.5 rounded-lg text-sm transition-colors focus-ring
                            ${
                              pathname === child.href
                                ? "text-moya-primarydark font-medium"
                                : "text-moya-muted hover:text-moya-text"
                            }
                          `}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </nav>
        </div>

        <div className="px-5 pb-6 pt-3 border-t border-moya-border">
          <NewButton />
        </div>
      </aside>
    </>
  );
}
