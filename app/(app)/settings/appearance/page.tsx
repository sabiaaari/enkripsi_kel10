"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function AppearancePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div>
      <PageHeader title="Appearance" subtitle="Light or dark mode" />
      <div className="grid sm:grid-cols-2 gap-3 max-w-md">
        <button
          onClick={() => setTheme("light")}
          className={`rounded-xl2 border p-5 text-left transition-colors ${
            theme === "light"
              ? "border-moya-primary bg-moya-soft"
              : "border-moya-border bg-moya-surface"
          }`}
        >
          <div className="w-full h-16 rounded-lg bg-[#FBFAFE] border border-moya-border mb-3" />
          <p className="text-sm text-moya-text font-medium">Light</p>
          <p className="text-xs text-moya-muted">Soft, calm and bright</p>
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`rounded-xl2 border p-5 text-left transition-colors ${
            theme === "dark"
              ? "border-moya-primary bg-moya-soft"
              : "border-moya-border bg-moya-surface"
          }`}
        >
          <div className="w-full h-16 rounded-lg bg-[#2C2740] border border-moya-border mb-3" />
          <p className="text-sm text-moya-text font-medium">Dark</p>
          <p className="text-xs text-moya-muted">Easy on late-night writing</p>
        </button>
      </div>
      <p className="text-xs text-moya-muted mt-4">
        Dark mode is coming soon — MOYA will remember your pick.
      </p>
    </div>
  );
}
