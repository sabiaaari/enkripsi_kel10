"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NewButton from "./NewButton";
import YarnMark from "./YarnMark";

type NavChild = { label: string; href: string };

type AccordionSection = {
  label: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  basePath: string;
  children: NavChild[];
};

export default function Sidebar() {
  const pathname = usePathname();

  // 1. State Pengendali untuk mengontrol visibilitas masing-masing accordion menu
  const [isNotesOpen, setIsNotesOpen] = useState(pathname.startsWith("/notes"));
  const [isFilesOpen, setIsFilesOpen] = useState(pathname.startsWith("/files"));
  const [isPrivateOpen, setIsPrivateOpen] = useState(pathname.startsWith("/private"));
  const [isSettingsOpen, setIsSettingsOpen] = useState(pathname.startsWith("/settings"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Definisi daftar accordion menu dengan state dan fungsi toggle masing-masing
  const accordionSections: AccordionSection[] = [
    {
      label: "Notes",
      icon: "📝",
      isOpen: isNotesOpen,
      onToggle: () => setIsNotesOpen((prev) => !prev),
      basePath: "/notes",
      children: [
        { label: "All Notes", href: "/notes" },
        { label: "Categories", href: "/notes/categories" },
      ],
    },
    {
      label: "Files",
      icon: "📎",
      isOpen: isFilesOpen,
      onToggle: () => setIsFilesOpen((prev) => !prev),
      basePath: "/files",
      children: [
        { label: "Documents", href: "/files/documents" },
      ],
    },
    {
      label: "Private",
      icon: "🔒",
      isOpen: isPrivateOpen,
      onToggle: () => setIsPrivateOpen((prev) => !prev),
      basePath: "/private",
      children: [
        { label: "Private Notes", href: "/private/notes" },
        { label: "Private Files", href: "/private/files" },
      ],
    },
    {
      label: "Settings",
      icon: "⚙️",
      isOpen: isSettingsOpen,
      onToggle: () => setIsSettingsOpen((prev) => !prev),
      basePath: "/settings",
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
            {/* Menu Dashboard (Direct Link) */}
            <div>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[15px]
                  transition-colors focus-ring
                  ${
                    pathname === "/dashboard"
                      ? "bg-moya-soft text-moya-primarydark font-medium"
                      : "text-moya-text hover:bg-moya-bg"
                  }
                `}
              >
                <span aria-hidden>🏠</span>
                <span>Dashboard</span>
              </Link>
            </div>

            {/* Menu Accordion: Notes, Files, Private, Settings */}
            {accordionSections.map((section) => (
              <div key={section.label}>
                {/* 2. Tombol Induk (Bukan Link, tanpa href, memicu onToggle) */}
                <button
                  type="button"
                  onClick={section.onToggle}
                  aria-expanded={section.isOpen}
                  className={`
                    w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[15px]
                    transition-colors focus-ring text-left select-none
                    ${
                      pathname.startsWith(section.basePath)
                        ? "bg-moya-soft text-moya-primarydark font-medium"
                        : "text-moya-text hover:bg-moya-bg"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden>{section.icon}</span>
                    <span>{section.label}</span>
                  </div>

                  {/* 4. Animasi Ikon Panah (Chevron): Menghadap ke kanan saat tertutup (rotate-0), ke bawah saat terbuka (rotate-90) */}
                  <svg
                    className={`w-3.5 h-3.5 text-moya-muted transition-transform duration-200 ${
                      section.isOpen ? "rotate-90" : "rotate-0"
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

                {/* 3. Logika Conditional Rendering: Sub-menu hanya di-render saat isOpen bernilai true */}
                {section.isOpen && (
                  <div className="ml-9 mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-moya-border pl-3">
                    {section.children.map((child) => (
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
            ))}
          </nav>
        </div>

        <div className="px-5 pb-6 pt-3 border-t border-moya-border">
          <NewButton />
        </div>
      </aside>
    </>
  );
}
