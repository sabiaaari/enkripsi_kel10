"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { encryptDiary } from "@/utils/crypto";
import { useMasterPassword } from "@/context/MasterPasswordContext";
import { supabase } from "@/utils/supabase";

const CATEGORIES = [
  { id: "Personal", name: "Personal" },
  { id: "College", name: "College" },
  { id: "Work", name: "Work" },
];

function NewNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPrivateQuery = searchParams.get("private") === "true";

  // Ambil masterPassword dan pemicu modal dari MasterPasswordContext
  const { masterPassword, requestMasterPassword } = useMasterPassword();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Personal");
  const [isEncrypted, setIsEncrypted] = useState(isPrivateQuery);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sinkronkan state isEncrypted saat parameter URL 'private' berubah
  useEffect(() => {
    const p = searchParams.get("private");
    if (p !== null) {
      setIsEncrypted(p === "true");
    }
  }, [searchParams]);

  // --- FUNGSI SIMPAN CATATAN KE SUPABASE (diary_notes) ---
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validasi Input Form
    if (!content.trim()) {
      alert("Note content cannot be empty!");
      return;
    }

    // 2. Validasi Master Password jika mode enkripsi aktif
    let pwd = masterPassword;
    if (isEncrypted && !pwd) {
      pwd = await requestMasterPassword();
      if (!pwd) {
        return;
      }
    }

    setIsProcessing(true);

    try {
      // 3. Validasi Sesi Pengguna
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("User not signed in", authError);
        alert("Session not found. Please sign in first.");
        return;
      }

      // Gabungkan judul ke dalam payload teks jika ada
      const plainText = title.trim()
        ? `[${title.trim()}]\n\n${content.trim()}`
        : content.trim();

      // 4. Siapkan data sesuai status toggle isEncrypted
      let payload: any;

      if (isEncrypted) {
        // Enkripsi client-side AES-256-GCM (Catatan Privat: TIDAK mengirim variabel category)
        const encrypted = await encryptDiary(plainText, pwd!);
        payload = {
          user_id: user.id,
          content: encrypted.content, // Variabel content berisi ciphertext Base64 (termasuk judul terenkripsi)
          is_encrypted: true,
          algorithm: encrypted.algorithm || "AES-256-GCM",
          salt: encrypted.salt,
          nonce: encrypted.nonce || encrypted.iv,
          auth_tag: encrypted.authTag,
        };
      } else {
        // Plaintext terbuka tanpa enkripsi (Catatan Publik: menyertakan nilai category yang dipilih)
        payload = {
          user_id: user.id,
          content: plainText, // Variabel content berisi teks asli (format [Judul]\n\nKonten)
          is_encrypted: false,
          category: category,
          algorithm: null,
          salt: null,
          nonce: null,
          auth_tag: null,
        };
      }

      // 5. Eksekusi INSERT ke Supabase
      let { data, error } = await supabase
        .from("diary_notes")
        .insert(payload)
        .select()
        .single();

      // Penanganan jika kolom 'category' belum terdaftar di skema Supabase
      if (
        error &&
        (error.code === "PGRST204" || error.code === "42703" || error.message?.includes("category"))
      ) {
        console.warn("Kolom category tidak ditemukan di skema Supabase, mencoba insert tanpa key category:", error.message);
        const { category: _omitted, ...safePayload } = payload;
        const retry = await supabase
          .from("diary_notes")
          .insert(safePayload)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Gagal menyimpan diary:", error);
        alert("Failed to save note: " + error.message);
        return;
      }

      // Simpan salinan lokal untuk ketahanan offline
      try {
        const savedNotes = JSON.parse(localStorage.getItem("vn_notes") || "[]");
        const newLocalItem = {
          id: data?.id || "n_" + Date.now(),
          title: title.trim() || (isEncrypted ? "Secret Note" : "Public Note"),
          category: isEncrypted ? null : category,
          folderId: isEncrypted ? null : category.toLowerCase(),
          content: payload.content,
          salt: payload.salt,
          iv: payload.nonce,
          authTag: payload.auth_tag,
          isProtected: isEncrypted,
          unlocked: true,
          decryptedContent: plainText,
          date: new Date().toLocaleDateString("en-US"),
        };
        localStorage.setItem("vn_notes", JSON.stringify([newLocalItem, ...savedNotes]));
      } catch (locErr) {
        console.warn("Gagal simpan lokal:", locErr);
      }

      alert(
        isEncrypted
          ? "Private note successfully encrypted and saved!"
          : "Public note successfully saved!"
      );

      // 6. Jika berhasil simpan, arahkan sesuai status toggle
      if (isEncrypted) {
        router.push("/private/notes");
      } else {
        router.push("/notes");
      }
    } catch (err: any) {
      console.error("Gagal menyimpan catatan:", err);
      const msg = err.message || "Failed to save note to Supabase database.";
      setErrorMessage(msg);
      alert("Failed to save note: " + msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title={isEncrypted ? "Write Private Note" : "Write Public Note"}
      />

      <section className="bg-moya-surface border border-moya-border p-4 sm:p-6 md:p-8 rounded-xl2 shadow-soft space-y-5">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1 animate-in fade-in">
            <p className="font-semibold text-red-900 flex items-center gap-1.5">
              <span>⚠️</span> An Error Occurred
            </p>
            <p className="font-mono text-[11px] text-red-700">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSaveNote} className="space-y-4">
          {isEncrypted ? (
            // Form Catatan Privat: Dropdown kategori dihapus sepenuhnya, input judul memanjang penuh
            <div>
              <label className="block text-xs font-medium text-moya-text mb-1.5">
                Note Title
              </label>
              <input
                type="text"
                placeholder="e.g., Financial Notes, Project Secrets..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring"
                required
              />
            </div>
          ) : (
            // Form Catatan Publik: Input judul dan dropdown kategori dengan state binding onChange yang benar
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-moya-text mb-1.5">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., College Project, Personal Thoughts, Ideas..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Note Content
            </label>
            <textarea
              rows={6}
              placeholder="Write your thoughts, secrets, or important plans here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring leading-relaxed"
              required
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push(isEncrypted ? "/private/notes" : "/notes")}
              className="px-5 py-2.5 border border-moya-border hover:bg-moya-soft text-moya-text text-sm font-medium rounded-xl transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 bg-moya-primary hover:bg-moya-primarydark text-white font-medium rounded-xl text-sm transition-colors shadow-card focus-ring disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{isEncrypted ? "Save Private Note" : "Save Public Note"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function NewNotePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-moya-muted">
          Loading form...
        </div>
      }
    >
      <NewNoteContent />
    </Suspense>
  );
}
