"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { encryptDiary } from "@/utils/crypto";
import { supabase } from "@/utils/supabase";
import { useMasterPassword } from "@/context/MasterPasswordContext";

function UploadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPrivateQuery = searchParams.get("private") === "true";

  // Ambil state dan fungsi modal dari MasterPasswordContext
  const { masterPassword, openModal, requestMasterPassword } = useMasterPassword();

  // State untuk privasi (Zero-Knowledge) diinisialisasi dari URL query parameter
  const [isPrivate, setIsPrivate] = useState(isPrivateQuery);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sinkronkan state isPrivate jika query parameter private di URL berubah
  useEffect(() => {
    const p = searchParams.get("private");
    if (p !== null) {
      setIsPrivate(p === "true");
    }
  }, [searchParams]);

  // Saat file dipilih, simpan objek File di state
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setErrorMessage(null);
  };

  /**
   * --- LOGIKA UTAMA: UNGGAH ZERO-KNOWLEDGE (STORAGE + TABEL) ---
   * 1. Validasi Master Password: Ambil dari MasterPasswordContext. Jika kosong, batalkan unggahan dan buka modal.
   * 2. Enkripsi File: Ubah file menjadi format yang bisa dienkripsi (ArrayBuffer/Base64), lalu enkripsi menggunakan masterPassword.
   * 3. Upload ke Storage (diary-files): Susun path sesuai aturan RLS (${user.id}/${file.name}) dan unggah encryptedData.
   * 4. Insert Metadata ke Tabel: Simpan metadata ke tabel encrypted_files dengan storage_path = filePath.
   */
  const handleFileUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const file = selectedFile;
    if (!file) {
      setErrorMessage("Please select a file to upload!");
      return;
    }

    // 1. Validasi Master Password jika opsi privasi aktif
    if (isPrivate && !masterPassword) {
      openModal();
      return;
    }

    setIsProcessing(true);

    try {
      // Verifikasi status autentikasi Supabase untuk mendapatkan user.id
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Session not found. Please sign in to your MOYA account first."
        );
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${Date.now()}_${safeFileName}`;

      if (isPrivate) {
        // --- ALUR BERKAS RAHASIA (ZERO-KNOWLEDGE AES-256-GCM) ---
        const fileBuffer = await file.arrayBuffer();
        const { ciphertext, salt, nonce } = await encryptDiary(
          fileBuffer,
          masterPassword!
        );

        const encryptedData = new Blob([ciphertext as any], {
          type: "application/octet-stream",
        });

        const { error: uploadError } = await supabase.storage
          .from("diary-files")
          .upload(filePath, encryptedData, {
            contentType: "application/octet-stream",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload ciphertext to Storage: ${uploadError.message}`);
        }

        const { error: insertError } = await supabase.from("encrypted_files").insert([
          {
            user_id: user.id,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type || "application/octet-stream",
            storage_path: filePath,
            is_encrypted: true,
            algorithm: "AES-256-GCM",
            salt: salt,
            nonce: nonce,
          },
        ]);

        if (insertError) {
          await supabase.storage.from("diary-files").remove([filePath]);
          throw new Error(
            `Failed to save file metadata to encrypted_files: ${insertError.message}`
          );
        }

        alert(
          `Success! Encrypted file "${file.name}" was successfully uploaded!`
        );

        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.push("/private/files");
      } else {
        // --- ALUR BERKAS TERBUKA / PUBLIK (TANPA ENKRIPSI) ---
        const { error: uploadError } = await supabase.storage
          .from("diary-files")
          .upload(filePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload file to Storage: ${uploadError.message}`);
        }

        const { error: insertError } = await supabase.from("encrypted_files").insert([
          {
            user_id: user.id,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type || "application/octet-stream",
            storage_path: filePath,
            is_encrypted: false,
            algorithm: "NONE",
            salt: null,
            nonce: null,
          },
        ]);

        if (insertError) {
          await supabase.storage.from("diary-files").remove([filePath]);
          throw new Error(
            `Failed to save file metadata: ${insertError.message}`
          );
        }

        alert(`Success! File "${file.name}" was successfully uploaded.`);

        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.push("/files/documents");
      }
    } catch (err: any) {
      console.error("Gagal melakukan alur upload:", err);
      const msg = err.message || "Failed to upload file to Supabase.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title={isPrivate ? "Upload Encrypted File (Private)" : "Upload File"}
      />

      <div className="bg-moya-surface border border-moya-border p-6 sm:p-8 rounded-xl2 shadow-soft max-w-xl mx-auto space-y-5">
        {/* Tampilan Error Asli jika terjadi kegagalan Supabase */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl2 text-xs text-red-800 space-y-1 animate-in fade-in">
            <p className="font-semibold text-red-900 flex items-center gap-1.5">
              <span>⚠️</span> Failed to Upload to Supabase
            </p>
            <p className="font-mono text-[11px] text-red-700">{errorMessage}</p>
          </div>
        )}


        {/* Status Indikator Master Password */}
        {isPrivate && (
          <div className="p-3 rounded-xl border text-xs flex items-center justify-between bg-moya-soft/60 border-moya-border">
            <span className="text-moya-text flex items-center gap-1.5">
              {masterPassword ? "🔓 Vault Session Active in RAM" : "🔒 Vault Locked (Password requested on upload)"}
            </span>
            {!masterPassword && (
              <button
                type="button"
                onClick={() => requestMasterPassword()}
                className="text-[11px] bg-moya-primary text-white px-2.5 py-1 rounded-lg hover:bg-moya-primarydark font-medium transition-colors"
              >
                Unlock Now
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Select File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*, .pdf, .doc, .docx"
              required
              onChange={handleFileChange}
              className="w-full text-xs text-moya-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-moya-soft file:text-moya-primarydark hover:file:bg-moya-primary hover:file:text-white file:transition-colors file:cursor-pointer cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="p-3 bg-moya-bg border border-moya-border rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-moya-text flex items-center gap-1.5">
                  <span>{selectedFile.type?.includes("image") ? "🖼️" : "📄"}</span>
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                </p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-moya-soft text-moya-primarydark">
                  {selectedFile.type?.toLowerCase().includes("image") ? "IMAGE" : "DOCUMENT"}
                </span>
              </div>
              <p className="text-moya-muted">
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Unknown type"}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || !selectedFile}
            className="w-full py-3 bg-moya-primary hover:bg-moya-primarydark text-white font-medium rounded-xl text-sm transition-colors shadow-card focus-ring disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Supabase Cloud...</span>
              </>
            ) : isPrivate ? (
              <>
                <span>🔐</span>
                <span>Encrypt & Upload to Supabase</span>
              </>
            ) : (
              <span>Upload to Supabase</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function FileUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-moya-muted">
          Loading upload form...
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
