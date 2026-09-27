"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const options = [
  { icon: "📝", label: "Write a Note" },
  { icon: "📷", label: "Upload Image" },
  { icon: "📄", label: "Upload Document" },
];

export default function NewButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div className="absolute bottom-full mb-3 left-0 right-0 bg-moya-surface border border-moya-border rounded-xl2 shadow-soft p-2 animate-in">
          <p className="px-2.5 pt-1.5 pb-2 text-xs uppercase tracking-wide text-moya-muted">
            + New
          </p>
          <div className="flex flex-col">
            {options.map((opt) => (
              <button
                key={opt.label}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-moya-text hover:bg-moya-bg text-left focus-ring"
                onClick={() => {
                  setOpen(false);
                  if (opt.label === "Write a Note") {
                    router.push("/notes");
                  }
                }}
              >
                <span aria-hidden>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="thread-divider my-2" />
          <label className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm text-moya-text cursor-pointer">
            <span className="flex items-center gap-1.5">🔒 Make Private</span>
            <span
              onClick={() => setIsPrivate((v) => !v)}
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
          </label>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-moya-primary hover:bg-moya-primarydark text-white font-medium py-2.5 shadow-card transition-colors focus-ring"
      >
        <span aria-hidden>＋</span> New
      </button>
    </div>
  );
}
