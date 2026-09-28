"use client";

import React, { useState, useEffect } from "react";
import { useMasterPassword } from "@/context/MasterPasswordContext";
import { supabase } from "@/utils/supabase";
import { decryptDiary } from "@/utils/crypto";

export default function MasterPasswordModal() {
  const { isModalOpen, setMasterPassword, closeModal } = useMasterPassword();
  const [inputPassword, setInputPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Reset input dan error saat modal dibuka/ditutup
  useEffect(() => {
    if (isModalOpen) {
      setInputPassword("");
      setError(null);
      setShowPassword(false);
      setIsVerifying(false);
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
      // 1. Fetch 1 private note row from diary_notes belonging to user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("diary_notes")
        .select("*")
        .eq("is_encrypted", true);

      if (user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data: sampleNotes, error: fetchError } = await query
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Failed to retrieve sample data for validation:", fetchError);
        throw new Error(fetchError.message || "Failed to verify note.");
      }

      // 2. Decryption Trial (Try-Catch)
      if (sampleNotes && sampleNotes.length > 0) {
        const sample = sampleNotes[0];
        const cipher = sample.content || sample.encrypted_content;
        const salt = sample.salt;
        const nonce = sample.nonce || sample.iv;
        const authTag = sample.auth_tag;

        if (cipher && salt && nonce) {
          try {
            await decryptDiary(cipher, salt, nonce, passwordToTest);
          } catch (decryptErr) {
            setInputPassword("");
            const errorMsg = "Access Denied: Incorrect Master Password!";
            setError(errorMsg);
            alert(errorMsg);
            return;
          }
        }
      } else {
        // 3. Empty vault handling
        console.info(
          "Vault empty (no encrypted notes yet). Accepting password for this session."
        );
      }

      // On success (or empty vault): store password in context and close modal
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
              Unlock Vault
            </h2>
            <p className="text-xs text-moya-muted mt-1 leading-relaxed">
              Enter your <strong className="text-moya-text">Master Password</strong>
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Master Password
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
