"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [isNotesOpen, setIsNotesOpen] = useState(pathname.startsWith("/notes"));
  const [isPrivateOpen, setIsPrivateOpen] = useState(pathname.startsWith("/private"));
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith("/settings"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Daftar item navigasi: Menu tunggal untuk Dashboard dan Public Files, serta Accordion untuk Notes, Private, Settings
  const navItems: NavItem[] = [
    {
      kind: "link",
      label: "Dashboard",
      icon: "🏠",
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      kind: "accordion",
      label: "Notes",
      icon: "📝",
      isOpen: isNotesOpen,
      onToggle: () => setIsNotesOpen((prev) => !prev),
      isActive: pathname.startsWith("/notes"),
      children: [
        { label: "All Notes", href: "/notes" },
        { label: "Categories", href: "/notes/categories" },
      ],
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
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-moya-border bg-moya-surface sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <YarnMark size={22} />
          <span className="font-display text-lg text-moya-text">MOYA</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-moya-text px-2 py-1 rounded-lg focus-ring"
          aria-label="Toggle menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      <aside
        className={`
          w-64 shrink-0 bg-moya-surface border-r border-moya-border
          flex-col justify-between
          md:flex md:sticky md:top-0 md:h-screen
          ${mobileOpen ? "flex fixed inset-0 z-20 pt-16" : "hidden"}
        `}
      >
        <div className="px-5 pt-7 pb-3 overflow-y-auto">
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
