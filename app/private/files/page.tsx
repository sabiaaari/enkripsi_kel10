"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";
import { encryptDiary, decryptDiary } from "@/utils/crypto";
import { useMasterPassword } from "@/context/MasterPasswordContext";

export type PrivateFileItem = {
  id: string;
  user_id?: string;
  original_filename: string;
  file_name?: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  is_encrypted: boolean;
  algorithm: string;
  salt: string;
  nonce: string;
  auth_tag?: string;
  created_at?: string;
};

export default function PrivateFilesPage() {
  const { masterPassword, openModal, requestMasterPassword } = useMasterPassword();
  const [files, setFiles] = useState<PrivateFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [activeModalFile, setActiveModalFile] = useState<PrivateFileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // --- LOGIKA FETCH METADATA BERKAS TERENKRIPSI (TANPA AUTO-DEKRIPSI) ---
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    try {
      // Ambil metadata dari tabel encrypted_files (filter ketat hanya berkas terenkripsi dengan salt)
      const { data, error } = await supabase
        .from("encrypted_files")
        .select("*")
        .eq("is_encrypted", true)
        .not("salt", "is", null)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows: PrivateFileItem[] = (data || [])
        .filter((row: any) => row.is_encrypted !== false && Boolean(row.salt || row.file_salt))
        .map((row: any) => ({
        id: String(row.id),
        user_id: row.user_id,
        original_filename: row.original_filename || row.file_name || row.name || "Encrypted File",
        file_name: row.original_filename || row.file_name || row.name || "Encrypted File",
        file_size: row.file_size || 0,
        mime_type: row.mime_type || row.type || "application/octet-stream",
        storage_path: row.storage_path || "",
        is_encrypted: row.is_encrypted ?? true,
        algorithm: row.algorithm || "AES-256-GCM",
        salt: row.salt || row.file_salt || "",
        nonce: row.nonce || row.iv || row.file_iv || row.file_nonce || "",
        auth_tag: row.auth_tag || row.authTag || "",
        created_at: row.created_at,
      }));

      setFiles(rows);
    } catch (err: any) {
      console.error("Koneksi Supabase error:", err);
      setDbError(err.message || "Failed to fetch files from Supabase");
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // --- FUNGSI UNDUH & DEKRIPSI MANUAL (handleDownload) ---
  const handleDownload = async (file: PrivateFileItem) => {
    // 1. Cek apakah masterPassword tersedia dari Context, jika belum ada, minta dan tunggu input pengguna
    let pwd = masterPassword;
    if (!pwd) {
      pwd = await requestMasterPassword();
    }

    if (!pwd) {
      alert("Master Password is required to decrypt this file. Please unlock your vault first.");
      return;
    }

    if (!file.storage_path) {
      alert("Storage file path not found.");
      return;
    }

    setDownloadingId(file.id);

    try {
      // 2. Tarik/unduh ciphertext fail dari Supabase Storage
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("diary-files")
        .download(file.storage_path);

      if (downloadError || !fileBlob) {
        throw downloadError || new Error("Failed to download file from storage");
      }

      // Validasi metadata kriptografi isi berkas
      if (!file.salt || !file.nonce) {
        throw new Error(
          `Metadata kriptografi berkas tidak lengkap (salt: "${file.salt}", nonce: "${file.nonce}") untuk berkas "${file.original_filename}".`
        );
      }

      console.log("[PrivateFiles] Downloading & Decrypting file:", {
        fileName: file.original_filename,
        storagePath: file.storage_path,
        fileBlobSize: fileBlob.size,
        hasSalt: Boolean(file.salt),
        saltLength: file.salt.length,
        hasNonce: Boolean(file.nonce),
        nonceLength: file.nonce.length,
        hasAuthTag: Boolean(file.auth_tag),
      });

      // 3. Dekripsi buffer/blob yang ditarik tersebut menggunakan fungsi AES-256-GCM
      const cipherBuffer = await fileBlob.arrayBuffer();
      let decryptedBuffer: ArrayBuffer | null = null;
      let lastDecryptError: any = null;

      try {
        decryptedBuffer = (await decryptDiary(
          cipherBuffer,
          file.salt,
          file.nonce,
          pwd,
          file.auth_tag || ""
        )) as ArrayBuffer;
      } catch (firstErr) {
        lastDecryptError = firstErr;
        // Fallback jika file di storage tertimpa oleh record lain dengan storage_path yang sama
        const siblingFiles = files.filter(
          (f) => f.storage_path === file.storage_path && f.id !== file.id && f.salt && f.nonce
        );

        for (const sibling of siblingFiles) {
          try {
            decryptedBuffer = (await decryptDiary(
              cipherBuffer,
              sibling.salt,
              sibling.nonce,
              pwd,
              sibling.auth_tag || ""
            )) as ArrayBuffer;
            console.log("[PrivateFiles] Berhasil didekripsi menggunakan metadata sibling record:", sibling.id);
            break;
          } catch {}
        }

        if (!decryptedBuffer) {
          throw lastDecryptError;
        }
      }

      // 4. Ubah hasil dekripsi menjadi Blob
      const decryptedBlob = new Blob([decryptedBuffer], {
        type: file.mime_type || "application/octet-stream",
      });

      // 5. Buat Object URL dan buat elemen <a> sementara untuk memicu download ke perangkat pengguna
      const downloadUrl = URL.createObjectURL(decryptedBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = file.file_name || file.original_filename || "downloaded_file";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Bersihkan Object URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err: any) {
      console.error("Gagal mengunduh dan mendekripsi berkas:", err);
      alert("Failed to decrypt file: " + (err.message || err));
    } finally {
      setDownloadingId(null);
    }
  };

  // --- LOGIKA ENKRIPSI BERKAS (STORAGE + INSERT KE TABEL) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 1. Validasi Master Password: Ambil dari MasterPasswordContext. Jika kosong, batalkan unggahan dan buka modal.
    if (!masterPassword) {
      openModal();
      return;
    }

    setIsUploading(true);
    setDbError(null);

    try {
      // 1. Verifikasi pengguna login
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Invalid user session. Please sign in first.");
      }

      // 2. ENKRIPSI SISI KLIEN: Konversi berkas ke ArrayBuffer & Enkripsi AES-256-GCM
      const file = selectedFile;
      const fileBuffer = await file.arrayBuffer();
      const { ciphertext, salt, nonce, authTag } = await encryptDiary(
        fileBuffer,
        masterPassword
      );

      // Siapkan encryptedData untuk Storage
      const encryptedData = new Blob([ciphertext as any], {
        type: "application/octet-stream",
      });

      // 3. UNGGAH KE SUPABASE STORAGE (MEMATUHI ATURAN RLS DENGAN FORMAT DIREKTORI user.id):
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${Date.now()}_${safeName}.enc`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("diary-files")
        .upload(filePath, encryptedData, {
          contentType: "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload to Supabase Storage: ${uploadError.message}`);
      }

      // 4. SIMPAN METADATA KE TABEL ENCRYPTED_FILES (INSERT TANPA AUTH_TAG)
      const { data: insertData, error: insertError } = await supabase
        .from("encrypted_files")
        .insert([
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
            auth_tag: authTag,
          },
        ])
        .select();

      if (insertError) {
        // Rollback berkas di storage jika insert metadata gagal
        await supabase.storage.from("diary-files").remove([filePath]);
        throw new Error(
          `Failed to save file metadata to table: ${insertError.message}`
        );
      }

      // 5. Update local state
      const row = insertData?.[0] || {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        user_id: user.id,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
        storage_path: filePath,
        is_encrypted: true,
        algorithm: "AES-256-GCM",
        salt,
        nonce,
      };

      const newItem: PrivateFileItem = {
        ...row,
        file_name: selectedFile.name,
      };

      setFiles((prev) => [newItem, ...prev]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      alert(`File "${selectedFile.name}" successfully encrypted and uploaded to Supabase Storage & Database!`);
    } catch (err: any) {
      console.error(err);
      setDbError(err.message || "Failed to upload file.");
      alert("Failed to upload file: " + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  // --- HAPUS BERKAS (TABEL + STORAGE) ---
  const handleDeleteFile = async (item: PrivateFileItem) => {
    if (!confirm(`Delete file "${item.original_filename}" from Supabase?`)) return;

    try {
      const { error: deleteDbError } = await supabase
        .from("encrypted_files")
        .delete()
        .eq("id", item.id);

      if (deleteDbError) throw deleteDbError;

      if (item.storage_path) {
        await supabase.storage.from("diary-files").remove([item.storage_path]);
      }

      setFiles((prev) => prev.filter((f) => f.id !== item.id));
    } catch (err: any) {
      console.error("Gagal menghapus:", err);
      alert("Failed to delete: " + (err.message || err));
    }
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Private Files"
      />

      {/* Tampilan Error Asli dari Supabase (Tanpa fallback localStorage) */}
      {dbError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl2 text-xs text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold text-red-900 text-sm">Supabase Database Error</p>
              <p className="mt-0.5 font-mono text-[11px] text-red-700">{dbError}</p>
            </div>
          </div>
          <button
            onClick={() => fetchFiles()}
            className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl font-medium transition-colors whitespace-nowrap shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Card Upload Berkas Terenkripsi */}
      <section className="bg-moya-surface border border-moya-border p-6 rounded-xl2 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-moya-border pb-3">
          <h2 className="font-display text-base text-moya-text flex items-center gap-2">
            <span>📎</span> Upload & Encrypt File
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="w-full text-xs text-moya-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-moya-soft file:text-moya-primarydark hover:file:bg-moya-primary hover:file:text-white file:transition-colors file:cursor-pointer cursor-pointer"
          />
          {isUploading && (
            <span className="text-xs text-moya-primarydark animate-pulse shrink-0">
              Uploading...
            </span>
          )}
        </div>
      </section>

      {/* Daftar Berkas Pribadi */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base text-moya-text flex items-center gap-2">
            <span>📁</span> Private Files ({files.length})
          </h3>
          <button
            onClick={() => fetchFiles()}
            className="text-xs text-moya-primarydark hover:underline flex items-center gap-1"
          >
            🔄 Refresh Data
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
            <p className="text-sm text-moya-muted animate-pulse">
              Loading file list...
            </p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
            <p className="text-sm text-moya-muted">No private files stored yet.</p>
            <p className="text-xs text-moya-muted mt-1">
              Use the panel above to upload photos or documents.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {files.map((file) => {
              const isImage = file.mime_type?.startsWith("image/");
              const formattedSize = file.file_size
                ? `${(file.file_size / 1024).toFixed(1)} KB`
                : "0 KB";
              const formattedDate = file.created_at
                ? new Date(file.created_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Today";

              return (
                <div
                  key={file.id}
                  className="bg-moya-surface border border-moya-border p-4 rounded-xl2 shadow-card space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">
                        {isImage ? "🖼️" : "📄"}
                      </span>
                      <span className="text-[11px] text-moya-muted">
                        {formattedDate}
                      </span>
                    </div>

                    <div>
                      <h4
                        className="font-medium text-sm text-moya-text truncate break-words"
                        title={file.file_name || file.original_filename}
                      >
                        {file.file_name || file.original_filename}
                      </h4>
                      <p className="text-[11px] text-moya-muted mt-0.5 truncate">
                        {formattedSize} • {file.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-moya-border flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Tombol Unduh & Dekripsi Manual */}
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="text-xs bg-moya-soft hover:bg-moya-primary hover:text-white text-moya-primarydark px-3 py-1.5 rounded-lg border border-moya-border font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {downloadingId === file.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-moya-primarydark border-t-transparent rounded-full animate-spin" />
                          <span>Decrypting...</span>
                        </>
                      ) : (
                        <>
                          <span>⬇️</span>
                          <span>Download & Decrypt</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file)}
                      className="text-red-500 hover:text-red-700 text-[11px] px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Detail Kriptografi Berkas (Sesuai Skema Tabel & Storage) */}
      {activeModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in">
          <div className="bg-moya-surface border border-moya-border rounded-xl2 shadow-soft max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-moya-border pb-3">
              <h3 className="font-display font-medium text-base text-moya-text">
                🔐 Cryptographic Metadata
              </h3>
              <button
                onClick={() => setActiveModalFile(null)}
                className="text-moya-muted hover:text-moya-text text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-medium text-moya-text mb-0.5">Original Filename (original_filename):</p>
                <p className="text-moya-muted font-mono">{activeModalFile.original_filename}</p>
              </div>

              <div>
                <p className="font-medium text-moya-text mb-1">Storage Path (storage_path):</p>
                <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-primarydark break-all">
                  bucket: diary-files / {activeModalFile.storage_path}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium text-moya-text mb-1">Algorithm (algorithm):</p>
                  <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted">
                    {activeModalFile.algorithm || "AES-256-GCM"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-moya-text mb-1">Original Size (file_size):</p>
                  <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted">
                    {activeModalFile.file_size} bytes
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="font-medium text-moya-text mb-0.5">Salt (PBKDF2):</p>
                  <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted break-all">
                    {activeModalFile.salt || "-"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-moya-text mb-0.5">Nonce / IV (AES-GCM):</p>
                  <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted break-all">
                    {activeModalFile.nonce || "-"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-moya-text mb-0.5">Authentication Tag (auth_tag):</p>
                  <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted break-all">
                    {activeModalFile.auth_tag || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-moya-border flex justify-end">
              <button
                onClick={() => setActiveModalFile(null)}
                className="px-4 py-2 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

