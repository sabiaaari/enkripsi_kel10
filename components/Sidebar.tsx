"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NewButton from "./NewButton";
import YarnMark from "./YarnMark";

type NavChild = { label: string; href: string };
type NavSection = {
  label: string;
  href: string;
  icon: string;
  children?: NavChild[];
};

const sections: NavSection[] = [
  { label: "Home", href: "/dashboard", icon: "🏠" },
  {
    label: "Notes",
    href: "/notes",
    icon: "📝",
    children: [
      { label: "All Notes", href: "/notes" },
      { label: "Pinned", href: "/notes/pinned" },
      { label: "Categories", href: "/notes/categories" },
    ],
  },
  {
    label: "Files",
    href: "/files",
    icon: "📎",
    children: [
      { label: "Images", href: "/files/images" },
      { label: "Documents", href: "/files/documents" },
      { label: "Handwritten", href: "/files/handwritten" },
    ],
  },
  {
    label: "Private",
    href: "/private",
    icon: "🔒",
    children: [
      { label: "Private Notes", href: "/private/notes" },
      { label: "Private Files", href: "/private/files" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "⚙️",
    children: [
      { label: "Profile", href: "/settings/profile" },
      { label: "Appearance", href: "/settings/appearance" },
      { label: "Account", href: "/settings/account" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({
    Notes: pathname.startsWith("/notes"),
    Files: pathname.startsWith("/files"),
    Private: pathname.startsWith("/private"),
    Settings: pathname.startsWith("/settings"),
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = (label: string) =>
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* mobile top bar */}
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
            make own yarns
          </p>

          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <div key={section.label}>
                <div className="flex items-center">
                  <Link
                    href={section.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[15px]
                      transition-colors focus-ring
                      ${
                        isActive(section.href)
                          ? "bg-moya-soft text-moya-primarydark font-medium"
                          : "text-moya-text hover:bg-moya-bg"
                      }
                    `}
                  >
                    <span aria-hidden>{section.icon}</span>
                    <span>{section.label}</span>
                  </Link>
                  {section.children && (
                    <button
                      onClick={() => toggle(section.label)}
                      aria-label={`Toggle ${section.label}`}
                      aria-expanded={open[section.label]}
                      className="px-2 py-2.5 text-moya-muted hover:text-moya-text focus-ring rounded-lg"
                    >
                      <span
                        className={`inline-block transition-transform text-xs ${
                          open[section.label] ? "rotate-180" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </button>
                  )}
                </div>
                {section.children && open[section.label] && (
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
