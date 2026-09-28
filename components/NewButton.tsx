"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function NewButton() {
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Ambil state 'Make Private' dari localStorage jika ada
  useEffect(() => {
    const saved = localStorage.getItem("moya_make_private");
    if (saved !== null) {
      setIsPrivate(saved === "true");
    }
  }, []);

  // Tutup dropdown saat klik di luar elemen
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleTogglePrivate = () => {
    setIsPrivate((prev) => {
      const next = !prev;
      localStorage.setItem("moya_make_private", String(next));
      return next;
    });
  };

  // 1. Logika URL Dinamis berdasarkan state isPrivate menggunakan Query Parameters
  const noteHref = isPrivate ? "/notes/new?private=true" : "/notes/new?private=false";
  const fileHref = isPrivate ? "/files/upload?private=true" : "/files/upload?private=false";

  const menuOptions = [
    {
      icon: "📝",
      label: "Write a Note",
      href: noteHref,
    },
    {
      icon: "📎",
      label: "Upload File",
      href: fileHref,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div className="absolute bottom-full mb-3 left-0 right-0 bg-moya-surface border border-moya-border rounded-xl2 shadow-soft p-2 animate-in z-50">
          <p className="px-2.5 pt-1.5 pb-2 text-xs uppercase tracking-wide text-moya-muted">
            + New
          </p>

          <div className="flex flex-col">
            {menuOptions.map((opt) => (
              <Link
                key={opt.label}
                href={opt.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-moya-text hover:bg-moya-bg text-left focus-ring transition-colors"
              >
                <span aria-hidden>{opt.icon}</span>
                <span>{opt.label}</span>
              </Link>
            ))}
          </div>

          <div className="thread-divider my-2" />

          {/* Toggle Switch 'Make Private' yang mengendalikan state isPrivate */}
          <div
            onClick={handleTogglePrivate}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm text-moya-text cursor-pointer select-none rounded-lg hover:bg-moya-bg transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>{isPrivate ? "🔒" : "🔓"}</span>
              <span>Make Private</span>
            </span>
            <span
              className={`w-9 h-5 rounded-full transition-colors relative ${
                isPrivate ? "bg-moya-primary" : "bg-moya-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isPrivate ? "translate-x-4" : ""
                }`}
              />
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-moya-primary hover:bg-moya-primarydark text-white font-medium py-2.5 shadow-card transition-colors focus-ring"
      >
        <span aria-hidden>＋</span> New
      </button>
    </div>
  );
}
