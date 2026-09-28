"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { decryptDiary } from "@/utils/crypto";
import { useMasterPassword } from "@/context/MasterPasswordContext";

export type PrivateNoteDetail = {
  id: string;
  user_id?: string;
  title: string;
  decryptedContent: string;
  encryptedContent: string;
  algorithm?: string;
  salt: string;
  nonce: string;
  auth_tag?: string;
  is_encrypted: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function PrivateNoteDetailPage({
  params,
}: {
  params?: { id: string };
}) {
  const router = useRouter();
  const routeParams = useParams();
  const noteId = params?.id || (routeParams?.id as string);

  const { masterPassword, requestMasterPassword } = useMasterPassword();
  const [note, setNote] = useState<PrivateNoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);

  // Fetch data catatan terenkripsi dari Supabase dan jalankan dekripsi AES-256-GCM
  const fetchAndDecryptDetail = useCallback(async () => {
    if (!noteId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Ambil catatan dari Supabase berdasarkan ID
      const { data, error: fetchError } = await supabase
        .from("diary_notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (fetchError) {
        console.error("Gagal mengambil data catatan privat dari Supabase:", fetchError);
        throw fetchError;
      }

      if (!data) {
        throw new Error("Private note not found.");
      }

      // 2. Ambil master password (jika belum ada di memori, minta ke pengguna)
      let pwd = masterPassword;
      if (!pwd) {
        pwd = await requestMasterPassword();
      }

      if (!pwd) {
        throw new Error("Password is required to decrypt this private note.");
      }

      // 3. Dekripsi AES-256-GCM sisi klien (Zero-Knowledge)
      const cipher = data.content || data.encrypted_content || "";
      const salt = data.salt || "";
      const nonce = data.nonce || data.iv || "";

      let plainText = "";
      try {
        plainText = await decryptDiary(cipher, salt, nonce, pwd);
      } catch (decErr) {
        console.error("Gagal mendekripsi catatan:", decErr);
        throw new Error("Decryption failed. Incorrect master password or corrupted ciphertext.");
      }

      // Format judul dan isi jika teks dikemas dengan format [Judul]\n\nKonten
      let displayTitle = data.title;
      let displayBody = plainText;

      if (!displayTitle && plainText) {
        if (plainText.startsWith("[") && plainText.includes("]\n\n")) {
          const endIdx = plainText.indexOf("]\n\n");
          displayTitle = plainText.slice(1, endIdx);
          displayBody = plainText.slice(endIdx + 3);
        } else if (plainText.includes("\n\n")) {
          const parts = plainText.split("\n\n");
          displayTitle = parts[0];
          displayBody = parts.slice(1).join("\n\n");
        } else {
          displayTitle = "Secret Note";
        }
      }

      setNote({
        id: String(data.id),
        user_id: data.user_id,
        title: displayTitle || "Untitled Private Note",
        decryptedContent: displayBody,
        encryptedContent: cipher,
        algorithm: data.algorithm || "AES-256-GCM",
        salt,
        nonce,
        auth_tag: data.auth_tag,
        is_encrypted: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (err: any) {
      console.error("Error saat fetch & dekripsi detail catatan:", err);
      setError(err.message || "Failed to load private note");
    } finally {
      setIsLoading(false);
    }
  }, [noteId, masterPassword, requestMasterPassword]);

  useEffect(() => {
    fetchAndDecryptDetail();
  }, [fetchAndDecryptDetail]);

  // Hapus Catatan dari Supabase
  const handleDeleteNote = async () => {
    if (!note) return;
    if (!confirm("Are you sure you want to delete this private note?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("diary_notes")
        .delete()
        .eq("id", note.id);

      if (deleteError) throw deleteError;

      alert("Private note successfully deleted.");
      router.push("/private/notes");
    } catch (err: any) {
      console.error("Gagal menghapus catatan privat:", err);
      alert("Failed to delete note: " + (err.message || err));
    }
  };

  // Salin isi catatan ke clipboard
  const handleCopyNote = () => {
    if (!note) return;
    navigator.clipboard.writeText(`${note.title}\n\n${note.decryptedContent}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Navigasi Kembali & Tombol Aksi Bagian Atas */}
      <div className="flex items-center justify-between">
        <Link
          href="/private/notes"
          className="inline-flex items-center gap-2 text-xs font-medium text-moya-muted hover:text-moya-primarydark transition-colors px-3 py-1.5 rounded-lg bg-moya-surface border border-moya-border hover:border-moya-primarydark/30 shadow-xs"
        >
          <span>←</span> Back to Private Notes
        </Link>

        {note && !isLoading && !error && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNote}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-moya-surface border border-moya-border hover:bg-moya-soft text-moya-text transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isCopied ? "✓" : "📋"}</span>
              <span>{isCopied ? "Copied!" : "Copy"}</span>
            </button>
            <button
              onClick={handleDeleteNote}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>🗑️</span> Delete
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-20 bg-moya-surface border border-dashed border-moya-border rounded-xl2">
          <div className="animate-spin w-8 h-8 border-2 border-moya-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-moya-muted animate-pulse">Decrypting private note with AES-256-GCM...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl2 text-center space-y-3">
          <div className="text-2xl">⚠️</div>
          <h3 className="font-semibold text-red-900 text-sm">Failed to Decrypt Private Note</h3>
          <p className="text-xs text-red-700">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => fetchAndDecryptDetail()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Detail Konten Catatan Privat Penuh */}
      {!isLoading && !error && note && (
        <article className="bg-moya-surface border border-moya-border rounded-xl2 p-6 sm:p-10 shadow-card space-y-6">
          {/* Header Catatan */}
          <div className="border-b border-moya-border pb-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-moya-muted">
                {note.created_at
                  ? new Date(note.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Today"}
              </span>
            </div>

            <h1 className="font-display font-medium text-2xl sm:text-3xl text-moya-text leading-tight">
              {note.title}
            </h1>
          </div>

          {/* Isi Konten Catatan Lengkap (Plaintext yang Berhasil Didekripsi) */}
          <div className="text-moya-text text-base sm:text-[17px] leading-relaxed whitespace-pre-wrap font-sans bg-moya-bg/50 p-5 sm:p-7 rounded-xl border border-moya-border/60">
            {note.decryptedContent}
          </div>

        </article>
      )}
    </div>
  );
}
