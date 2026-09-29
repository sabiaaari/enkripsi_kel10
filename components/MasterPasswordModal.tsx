"use client";

import React, { useState, useEffect } from "react";
import { useMasterPassword } from "@/context/MasterPasswordContext";
import { supabase } from "@/utils/supabase";
import { encryptDiary, decryptDiary } from "@/utils/crypto";

const VAULT_CHALLENGE_STRING = "MOYA_VALID";

async function createVaultChallenge(password: string) {
  const enc = await encryptDiary(VAULT_CHALLENGE_STRING, password);
  return {
    ciphertext: enc.content,
    salt: enc.salt,
    iv: enc.iv,
    nonce: enc.nonce,
  };
}

async function verifyVaultChallenge(challenge: any, password: string): Promise<boolean> {
  try {
    const cipher = challenge.ciphertext || challenge.content;
    const salt = challenge.salt;
    const iv = challenge.iv || challenge.nonce;
    const decrypted = await decryptDiary(cipher, salt, iv, password);
    return decrypted === VAULT_CHALLENGE_STRING;
  } catch {
    return false;
  }
}

export default function MasterPasswordModal() {
  const { isModalOpen, setMasterPassword, closeModal } = useMasterPassword();
  const [inputPassword, setInputPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasExistingVault, setHasExistingVault] = useState<boolean>(true);

  // Reset input dan error saat modal dibuka/ditutup & cek status brankas
  useEffect(() => {
    if (isModalOpen) {
      setInputPassword("");
      setError(null);
      setShowPassword(false);
      setIsVerifying(false);

      const checkVaultStatus = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const userId = user?.id || "default";

          // 1. Cek LocalStorage
          const localChallenge = localStorage.getItem(`moya_vault_challenge_${userId}`);
          if (localChallenge) {
            setHasExistingVault(true);
            return;
          }

          // 2. Cek user_metadata di Supabase
          if (user?.user_metadata?.vault_challenge) {
            setHasExistingVault(true);
            localStorage.setItem(
              `moya_vault_challenge_${userId}`,
              JSON.stringify(user.user_metadata.vault_challenge)
            );
            return;
          }

          // 3. Cek apakah ada catatan terenkripsi sebelumnya di database
          if (user?.id) {
            const { data: notes } = await supabase
              .from("diary_notes")
              .select("id")
              .eq("user_id", user.id)
              .eq("is_encrypted", true)
              .limit(1);

            if (notes && notes.length > 0) {
              setHasExistingVault(true);
              return;
            }
          }

          // Jika tidak ada challenge maupun data lama, brankas baru pertama kali dibuat
          setHasExistingVault(false);
        } catch {
          setHasExistingVault(true);
        }
      };

      checkVaultStatus();
    }
  }, [isModalOpen]);

  // Tutup modal jika tombol Escape ditekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen && !isVerifying) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isVerifying, closeModal]);

  // Aturan Validasi Kekuatan Kata Sandi:
  // 1. Wajib minimal 8 karakter
  // 2. Minimal 1 angka
  const hasMinLength = inputPassword.length >= 8;
  const hasNumber = /\d/.test(inputPassword);
  const isPasswordValid = hasMinLength && hasNumber;

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordToTest = inputPassword.trim();
    if (!passwordToTest || !isPasswordValid) {
      setError("Password must be at least 8 characters and include at least 1 number.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id || "default";
      const storageKey = `moya_vault_challenge_${userId}`;

      // 1. Ambil token challenge tersimpan (LocalStorage atau user_metadata)
      let challenge: any = null;
      const rawLocal = localStorage.getItem(storageKey);
      if (rawLocal) {
        try {
          challenge = JSON.parse(rawLocal);
        } catch {
          challenge = null;
        }
      }

      if (!challenge && user?.user_metadata?.vault_challenge) {
        challenge = user.user_metadata.vault_challenge;
        localStorage.setItem(storageKey, JSON.stringify(challenge));
      }

      // 2. Kasus A: Challenge token ditemukan -> Lakukan Challenge-Response Verification
      if (challenge && challenge.ciphertext && challenge.salt && challenge.iv) {
        const isValid = await verifyVaultChallenge(challenge, passwordToTest);
        if (!isValid) {
          setInputPassword("");
          const errorMsg = "Kata sandi brankas salah!";
          setError(errorMsg);
          alert(errorMsg);
          return;
        }

        // Dekripsi berhasil: simpan ke state RAM dan buka brankas
        setMasterPassword(passwordToTest);
        setInputPassword("");
        setError(null);
        return;
      }

      // 3. Kasus B: Challenge belum ada tapi pengguna punya data catatan privat lama (Migrasi)
      if (user?.id) {
        const { data: sampleNotes } = await supabase
          .from("diary_notes")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_encrypted", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (sampleNotes && sampleNotes.length > 0) {
          const sample = sampleNotes[0];
          const cipher = sample.content || sample.encrypted_content;
          const salt = sample.salt;
          const nonce = sample.nonce || sample.iv;

          if (cipher && salt && nonce) {
            try {
              await decryptDiary(cipher, salt, nonce, passwordToTest);
            } catch (decryptErr) {
              setInputPassword("");
              const errorMsg = "Kata sandi brankas salah!";
              setError(errorMsg);
              alert(errorMsg);
              return;
            }

            // Sandi lama benar! Buat token challenge untuk mempercepat verifikasi masa depan
            const newChallenge = await createVaultChallenge(passwordToTest);
            localStorage.setItem(storageKey, JSON.stringify(newChallenge));
            await supabase.auth.updateUser({
              data: { vault_challenge: newChallenge },
            });

            setMasterPassword(passwordToTest);
            setInputPassword("");
            setError(null);
            return;
          }
        }
      }

      // 4. Kasus C: Pengguna baru pertama kali membuat Master Password
      const newChallenge = await createVaultChallenge(passwordToTest);
      localStorage.setItem(storageKey, JSON.stringify(newChallenge));

      if (user) {
        await supabase.auth.updateUser({
          data: { vault_challenge: newChallenge },
        });
      }

      // Simpan ke RAM dan buka brankas
      setMasterPassword(passwordToTest);
      setInputPassword("");
      setError(null);
    } catch (err: any) {
      console.error("Password validation failed:", err);
      setError(err.message || "An error occurred while validating password.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-moya-surface border border-moya-border rounded-xl2 shadow-soft p-6 sm:p-8 max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={closeModal}
          type="button"
          aria-label="Close Modal"
          className="absolute right-4 top-4 text-moya-muted hover:text-moya-text p-1.5 rounded-lg hover:bg-moya-soft transition-colors text-sm"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-moya-soft text-moya-primarydark flex items-center justify-center text-2xl mx-auto shadow-card">
            🔐
          </div>
          <div>
            <h2 className="font-display text-2xl text-moya-text">
              {hasExistingVault ? "Unlock Vault" : "Set Up Vault Password"}
            </h2>
            <p className="text-xs text-moya-muted mt-1 leading-relaxed">
              {hasExistingVault ? (
                <>
                  Enter your <strong className="text-moya-text">Master Password</strong>
                </>
              ) : (
                <>
                  Create a <strong className="text-moya-text">Master Password</strong> to secure your private vault
                </>
              )}
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              {hasExistingVault ? "Master Password" : "Create Master Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                disabled={isVerifying}
                placeholder="Enter your master password..."
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full px-4 py-2.5 rounded-xl border bg-moya-bg text-sm text-moya-text focus-ring pr-24 ${
                  error ? "border-moya-pink ring-1 ring-moya-pink" : "border-moya-border"
                } ${isVerifying ? "opacity-60 cursor-not-allowed" : ""}`}
              />
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-moya-muted hover:text-moya-text transition-colors select-none font-medium px-1.5 py-0.5 disabled:opacity-50"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Real-time Password Strength Feedback */}
            {inputPassword.length > 0 ? (
              isPasswordValid ? (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                  <span>✓</span> Strong password (meets requirements)
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                  <span>⚠️</span> Password must be at least 8 characters{!hasNumber ? " and include at least 1 number" : ""}
                </p>
              )
            ) : (
              <p className="text-xs text-moya-muted mt-1.5">
                Minimum 8 characters and at least 1 number
              </p>
            )}

            {error && <p className="text-xs text-[#b85368] mt-1.5 flex items-center gap-1"><span>⚠️</span> {error}</p>}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isVerifying || !isPasswordValid}
              className="w-full py-2.5 bg-moya-primary hover:bg-moya-primarydark disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-card focus-ring flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : hasExistingVault ? (
                <>
                  <span>🔐</span> Unlock Vault
                </>
              ) : (
                <>
                  <span>🔐</span> Save &amp; Unlock Vault
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isVerifying}
              onClick={closeModal}
              className="w-full py-2 text-xs text-moya-muted hover:text-moya-text disabled:opacity-50 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
