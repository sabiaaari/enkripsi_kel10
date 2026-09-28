"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Login Standar menggunakan Email dan Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      alert("Login successful! Welcome back.");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Login Error:", err);
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setErrorMsg(err.message || "Failed to sign in with Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 sm:p-8 bg-moya-surface border border-moya-border rounded-xl2 shadow-soft space-y-6">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-full bg-moya-soft flex items-center justify-center text-2xl mx-auto mb-2">
          👋
        </div>
        <h2 className="font-display text-2xl text-moya-text">Welcome Back</h2>
        <p className="text-xs text-moya-muted">
          Sign in to access your notes and encrypted files
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Google OAuth Login Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading}
        className="w-full py-2.5 px-4 bg-moya-bg hover:bg-moya-soft border border-moya-border text-moya-text font-medium rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2.5 focus-ring cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.29 21.48 7.37 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.21 0 10.05 0 12s.46 3.79 1.26 5.41l4.02-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.52 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
          />
        </svg>
        <span>{isGoogleLoading ? "Connecting to Google..." : "Sign in with Google"}</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-moya-border w-full"></div>
        <span className="bg-moya-surface px-3 text-[11px] text-moya-muted absolute">
          or with email
        </span>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-moya-text mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-moya-text mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-moya-primary hover:bg-moya-primarydark text-white font-medium rounded-xl text-sm transition-colors shadow-card focus-ring disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-moya-border text-xs text-moya-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-moya-primarydark hover:underline font-medium"
        >
          Sign up now
        </Link>
      </div>
    </div>
  );
}
