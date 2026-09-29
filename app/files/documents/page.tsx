"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import type { FileItem } from "@/lib/data";
import { supabase } from "@/utils/supabase";

export type DocumentItem = FileItem & {
  storage_path?: string;
  mime_type?: string;
};

// Fungsi utilitas format ukuran fail dari byte ke KB / MB
function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Fungsi utilitas untuk menentukan ikon berkas berdasarkan MIME type dan ekstensi berkas
function getFileIcon(file: DocumentItem): string {
  const mime = (file.mime_type || "").toLowerCase();
  const name = (file.file_name || file.name || "").toLowerCase();

  // 1. Gambar (PNG, JPG, JPEG, GIF, WEBP, SVG)
  if (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name)
  ) {
    return "🖼️";
  }

  // 2. Berkas PDF
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return "📕";
  }

  // 3. Dokumen Word / Teks Kantor
  if (
    mime.includes("word") ||
    mime.includes("document") ||
    /\.(docx?|odt)$/i.test(name)
  ) {
    return "📝";
  }

  // 4. Dokumen Teks Polos / Markdown
  if (mime.includes("text") || /\.(txt|md)$/i.test(name)) {
    return "📄";
  }

  // 5. Lembar Sebar / Spreadsheet (Excel, CSV)
  if (
    mime.includes("sheet") ||
    mime.includes("excel") ||
    mime.includes("csv") ||
    /\.(xlsx?|csv)$/i.test(name)
  ) {
    return "📊";
  }

  // 6. Arsip Berkas Terkompresi (ZIP, RAR, 7Z, TAR)
  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    /\.(zip|rar|7z|tar|gz)$/i.test(name)
  ) {
    return "📦";
  }

  // 7. Video & Audio
  if (mime.startsWith("video/") || /\.(mp4|mkv|webm)$/i.test(name)) {
    return "🎥";
  }
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg)$/i.test(name)) {
    return "🎵";
  }

  // Ikon default dokumen umum
  return "📄";
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Ambil SEMUA berkas publik dari database tanpa memfilter ekstensi/tipe MIME
        const { data, error } = await supabase
          .from("encrypted_files")
          .select("*")
          .eq("is_encrypted", false)
          .is("salt", null)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        } else if (data) {
          // Validasi ketat: pastikan berkas tidak memiliki indikator enkripsi
          const mapped: DocumentItem[] = data
            .filter((f: any) => !f.is_encrypted && !f.salt && !f.nonce)
            .map((f: any) => {
              const fileName = f.file_name || f.original_filename || f.name || "Untitled File";
              const mime = (f.mime_type || f.type || "").toLowerCase();
              const isImage =
                mime.startsWith("image/") ||
                /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(fileName);

              return {
                id: String(f.id),
                name: fileName,
                file_name: fileName,
                type: isImage ? ("image" as const) : ("document" as const),
                mime_type: f.mime_type || f.type || (isImage ? "image/jpeg" : "application/octet-stream"),
                size: formatFileSize(f.file_size || f.size),
                storage_path: f.storage_path,
                updatedAt: f.created_at
                  ? new Date(f.created_at).toLocaleDateString("en-US")
                  : "Today",
              };
            });
          setFiles(mapped);
        }
      } catch (err: any) {
        console.error("Fetch public files error:", err);
        setErrorMessage(err.message || "Failed to fetch public files from Supabase.");
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fungsi Unduh Berkas Publik
  const handleDownloadPublic = async (file: DocumentItem) => {
    if (!file.storage_path) {
      alert("Storage file path not found.");
      return;
    }

    setDownloadingId(file.id);
    try {
      // 1. Panggil Supabase Storage: unduh file publik dari bucket 'diary-files'
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("diary-files")
        .download(file.storage_path);

      if (downloadError || !fileBlob) {
        throw downloadError || new Error("Failed to download file from storage.");
      }

      // 2. Buat Object URL dari Blob yang dikembalikan
      const downloadUrl = URL.createObjectURL(fileBlob);

      // 3. Picu unduhan browser otomatis menggunakan elemen <a> sementara
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = file.file_name || file.name || "downloaded_file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke Object URL setelah unduhan dimulai
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err: any) {
      console.error("Gagal mengunduh berkas publik:", err);
      alert("Failed to download file: " + (err.message || err));
    } finally {
      setDownloadingId(null);
    }
  };

  // Fungsi Hapus Berkas Publik (Database + Storage)
  const handleDelete = async (fileOrId: DocumentItem | string) => {
    const file = typeof fileOrId === "string" ? files.find((f) => f.id === fileOrId) : fileOrId;
    if (!file) return;
    const fileId = file.id;
    const fileName = file.file_name || file.name || "this file";

    if (!confirm(`Apakah Anda yakin ingin menghapus berkas "${fileName}"?`)) {
      return;
    }

    setDeletingId(fileId);
    try {
      // 1. Hapus rekaman data berkas dari tabel basis data Supabase
      const { error: deleteDbError } = await supabase
        .from("encrypted_files")
        .delete()
        .eq("id", fileId);

      if (deleteDbError) {
        throw new Error(`Gagal menghapus data dari database: ${deleteDbError.message}`);
      }

      // 2. Hapus berkas mentah (blob) dari dalam bucket storage Supabase jika ada
      if (file.storage_path) {
        const { error: storageRemoveError } = await supabase.storage
          .from("diary-files")
          .remove([file.storage_path]);

        if (storageRemoveError) {
          console.warn("Gagal menghapus berkas dari storage bucket:", storageRemoveError.message);
        }
      }

      // 3. Pembaruan State (UX): hilangkan berkas langsung dari daftar antarmuka
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      console.error("Gagal menghapus berkas:", err);
      alert("Failed to delete file: " + (err.message || err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Public Files"
        subtitle="All public unencrypted files (images, documents, and PDFs) stored in MOYA"
      />

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl2 text-xs text-red-800 flex items-center justify-between">
          <p>⚠️ <strong>Supabase Error:</strong> {errorMessage}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <div className="animate-spin w-6 h-6 border-2 border-moya-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-moya-muted">Loading data...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <p className="text-sm text-moya-muted">No public files stored yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-xl2 border border-moya-border bg-moya-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Ikon Berkas Dinamis Berdasarkan Format / Tipe Berkas */}
                <div className="w-10 h-10 rounded-lg bg-moya-soft flex items-center justify-center text-lg shrink-0">
                  {getFileIcon(file)}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium text-moya-text truncate break-words"
                    title={file.file_name || file.name}
                  >
                    {file.file_name || file.name || "Untitled File"}
                  </p>
                  <p className="text-xs text-moya-muted mt-0.5 truncate">
                    {file.size} · {file.updatedAt}
                  </p>
                </div>
              </div>

              {/* Aksi Berkas: Download & Delete */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {/* Tombol Unduh Berkas Publik */}
                <button
                  type="button"
                  onClick={() => handleDownloadPublic(file)}
                  disabled={downloadingId === file.id}
                  className="text-xs bg-moya-soft hover:bg-moya-primary hover:text-white text-moya-primarydark px-3 py-1.5 rounded-lg border border-moya-border font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                  title="Download File"
                >
                  {downloadingId === file.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-moya-primarydark border-t-transparent rounded-full animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <span>⬇️</span>
                      <span>Download</span>
                    </>
                  )}
                </button>

                {/* Tombol Hapus Berkas Publik */}
                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  disabled={deletingId === file.id}
                  className="text-xs bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 hover:border-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                  title="Delete File"
                >
                  {deletingId === file.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
