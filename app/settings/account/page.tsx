"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";

export default function AccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Tarik Data Sesi Aktif (Supabase Auth) tepat saat halaman dimuat
  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.warn("Sesi pengguna tidak ditemukan:", authError);
          setIsLoading(false);
          return;
        }

        // 2. Sinkronisasi State Lokal: Ekstrak informasi email dan username
        setEmail(user.email || "");

        // Ambil username dari metadata autentikasi
        let resolvedUsername =
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          "";

        // Jika metadata kosong, coba ambil dari tabel 'profiles'
        if (!resolvedUsername) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.username) {
            resolvedUsername = profile.username;
          }
        }

        // Fallback jika tidak ditemukan username
        if (!resolvedUsername && user.email) {
          resolvedUsername = user.email.split("@")[0];
        }

        setUsername(resolvedUsername);
      } catch (err) {
        console.error("Gagal memuat profil pengguna:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Fungsi pembaruan username
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMessage({ type: "error", text: "Username cannot be empty." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Invalid user session.");

      // 1. Perbarui metadata di Supabase Auth
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: { username: username.trim() },
      });

      if (updateAuthError) throw updateAuthError;

      // 2. Perbarui tabel 'profiles'
      await supabase
        .from("profiles")
        .upsert({ id: user.id, username: username.trim() });

      setStatusMessage({
        type: "success",
        text: "Username successfully updated!",
      });
    } catch (err: any) {
      console.error("Gagal memperbarui username:", err);
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update username.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div>
      <PageHeader title="Account" subtitle="Your user account information in MOYA" />

      {isLoading ? (
        <div className="rounded-xl2 border border-dashed border-moya-border bg-moya-surface p-10 text-center max-w-md">
          <div className="w-6 h-6 border-2 border-moya-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-moya-muted">Loading account data...</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-md">
          {/* Card Sederhana Informasi Akun */}
          <div className="rounded-xl2 border border-moya-border bg-moya-surface p-6 sm:p-7 shadow-soft space-y-5">
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <span>{statusMessage.type === "success" ? "✅" : "⚠️"}</span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUsername} className="space-y-4">
              {/* 3. Elemen 1: Username (Dapat diubah) */}
              <div>
                <label className="block text-xs font-medium text-moya-text mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text focus-ring"
                />
              </div>

              {/* 3. Elemen 2: Email (Read-Only / Disabled) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-moya-text">
                    Email
                  </label>
                </div>
                <input
                  type="email"
                  value={email}
                  disabled
                  readOnly
                  className="w-full rounded-xl border border-moya-border bg-moya-soft/60 px-3.5 py-2.5 text-sm text-moya-muted cursor-not-allowed select-none"
                />
              </div>

              {/* Tombol Simpan Perubahan */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-moya-primary hover:bg-moya-primarydark text-white text-xs font-medium rounded-xl transition-colors shadow-card focus-ring disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl border border-red-200 bg-moya-surface hover:bg-red-50 text-xs text-red-600 font-medium transition-colors focus-ring cursor-pointer"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
