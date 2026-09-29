"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import YarnMark from "@/components/YarnMark";
import { supabase } from "@/utils/supabase";

export default function RootPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Logika Pengecekan Sesi (Supabase Auth):
  // 1. Jika pengguna sudah login -> otomatis redirect ke /dashboard
  // 2. Jika pengunjung belum login -> biarkan di root (/) untuk melihat Landing Page
  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && session.user) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Auth check error on root page:", err);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkAuthSession();

    // Dengarkan perubahan status autentikasi secara realtime
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        router.replace("/dashboard");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Loading indicator minimalis saat memeriksa sesi agar tidak terjadi kedipan (flicker)
  if (isCheckingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-moya-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-moya-muted font-medium">Checking session...</p>
      </div>
    );
  }

  // Tampilan Landing Page untuk pengunjung yang belum terautentikasi
  return (
    <div className="w-full min-h-screen bg-moya-bg text-moya-text flex flex-col justify-between">
      {/* 1. Simple Navbar */}
      <header className="w-full border-b border-moya-border">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 focus-ring rounded-lg shrink-0">
            <YarnMark size={28} />
            <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-moya-text">
              MOYA
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-moya-text hover:text-moya-primarydark transition-colors px-2 py-1.5 focus-ring rounded-lg"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm font-medium bg-moya-primary hover:bg-moya-primarydark text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-colors shadow-card focus-ring whitespace-nowrap"
            >
              Sign Up Free
            </Link>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="w-full flex-1 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 my-10 sm:my-16 md:my-20 space-y-12 sm:space-y-16">
        <section className="text-center space-y-5 sm:space-y-6 max-w-3xl mx-auto">
          {/* Main Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-moya-text leading-tight tracking-tight">
            Your Private Thoughts,{" "}
            <span className="text-moya-primarydark italic">Truly Private.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-sm sm:text-base md:text-lg text-moya-muted max-w-2xl mx-auto leading-relaxed">
            Even we cannot read your data. Protected with military-grade encryption
            directly inside your browser before ever touching the internet.
          </p>

          {/* Call to Action (CTA) */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-3.5 pt-2 w-full max-w-md md:max-w-none mx-auto">
            <Link
              href="/register"
              className="w-full md:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl font-medium text-sm sm:text-base transition-colors shadow-soft focus-ring text-center"
            >
              Start Writing (Sign Up)
            </Link>
            <a
              href="#features"
              className="w-full md:w-auto px-6 sm:px-7 py-3 sm:py-3.5 bg-moya-surface hover:bg-moya-soft border border-moya-border text-moya-text rounded-xl font-medium text-sm sm:text-base transition-colors focus-ring text-center"
            >
              Learn About Security
            </a>
          </div>
        </section>

        {/* 3. Features Section */}
        <section id="features" className="space-y-8 pt-6">
          <div className="text-center space-y-1.5">
            <h2 className="font-display text-2xl sm:text-3xl text-moya-text">
              Engineered for Uncompromising Security
            </h2>
            <p className="text-xs sm:text-sm text-moya-muted max-w-xl mx-auto">
              A modern architecture that ensures your privacy remains entirely in your own hands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Zero-Knowledge Privacy */}
            <div className="bg-moya-surface border border-moya-border p-6 sm:p-7 rounded-xl2 shadow-soft hover:shadow-card transition-shadow space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-moya-soft flex items-center justify-center text-2xl">
                  🔐
                </div>
                <h3 className="font-display text-lg font-medium text-moya-text">
                  Zero-Knowledge Privacy
                </h3>
                <p className="text-xs sm:text-sm text-moya-muted leading-relaxed">
                  No raw plaintext data ever reaches our servers. All encryption and authentication
                  tag validation happen purely inside your client browser.
                </p>
              </div>
            </div>

            {/* Card 2: Local Master Password */}
            <div className="bg-moya-surface border border-moya-border p-6 sm:p-7 rounded-xl2 shadow-soft hover:shadow-card transition-shadow space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-moya-soft flex items-center justify-center text-2xl">
                  🧠
                </div>
                <h3 className="font-display text-lg font-medium text-moya-text">
                  Local Master Password
                </h3>
                <p className="text-xs sm:text-sm text-moya-muted leading-relaxed">
                  Your master password resides only in local RAM memory and is never transmitted.
                  Encryption keys are derived via PBKDF2 with 600,000 iterations and wiped when closed.
                </p>
              </div>
            </div>

            {/* Card 3: Images & Notes Storage */}
            <div className="bg-moya-surface border border-moya-border p-6 sm:p-7 rounded-xl2 shadow-soft hover:shadow-card transition-shadow space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-moya-soft flex items-center justify-center text-2xl">
                  📁
                </div>
                <h3 className="font-display text-lg font-medium text-moya-text">
                  Encrypted Notes & Files
                </h3>
                <p className="text-xs sm:text-sm text-moya-muted leading-relaxed">
                  Comprehensive support for writing rich diary notes and uploading important photos or
                  documents, fully encrypted client-side before storage.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 4. Simple Footer */}
      <footer className="w-full border-t border-moya-border mt-auto">
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-moya-muted text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <YarnMark size={16} />
            <span>© 2026 MOYA — Make Own Yarns. Zero-Knowledge Private Workspace.</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-5 justify-center">
            <a href="#features" className="hover:text-moya-text transition-colors">
              Security
            </a>
            <Link href="/login" className="hover:text-moya-text transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-moya-text transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
