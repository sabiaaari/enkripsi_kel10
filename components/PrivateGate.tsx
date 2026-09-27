"use client";

import { useState } from "react";

export default function PrivateGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length >= 4) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="w-14 h-14 rounded-full bg-moya-soft flex items-center justify-center text-2xl mb-4">
        🔒
      </div>
      <h2 className="font-display text-xl text-moya-text mb-1.5">
        This space is private
      </h2>
      <p className="text-sm text-moya-muted mb-6 max-w-xs">
        Enter your PIN to see what you've tucked away here.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          placeholder="• • • •"
          className={`
            w-40 text-center tracking-[0.5em] rounded-xl border bg-moya-surface
            py-2.5 text-moya-text focus-ring
            ${error ? "border-moya-pink" : "border-moya-border"}
          `}
        />
        {error && (
          <p className="text-xs text-[#c06b7e]">That PIN didn't work — try again.</p>
        )}
        <button
          type="submit"
          className="rounded-xl bg-moya-primary hover:bg-moya-primarydark text-white text-sm font-medium px-6 py-2.5 transition-colors focus-ring"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
