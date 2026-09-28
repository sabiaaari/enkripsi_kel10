"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import type { FileItem } from "@/lib/data";
import { supabase } from "@/utils/supabase";

export type DocumentItem = FileItem & {
  storage_path?: string;
};

// Fungsi utilitas format ukuran fail dari byte ke KB / MB
function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // 1. Filter Privasi Supabase: HANYA ambil berkas publik (is_encrypted === false) & non-gambar
        const { data, error } = await supabase
          .from("encrypted_files")
          .select("*")
          .eq("is_encrypted", false)
          .not("mime_type", "ilike", "image/%")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        } else if (data) {
          // 2. Filter ekstensi/tipe MIME dokumen dan petakan data asli dari database
          const mapped: DocumentItem[] = data
            .filter((f: any) => {
              const mime = (f.mime_type || f.type || "").toLowerCase();
              return !mime.startsWith("image/") && mime !== "image";
            })
            .map((f: any) => ({
              id: String(f.id),
              name: f.file_name || f.original_filename || f.name || "Untitled Document",
              file_name: f.file_name || f.original_filename || f.name || "Untitled Document",
              type: "document" as const,
              size: formatFileSize(f.file_size || f.size),
              storage_path: f.storage_path,
              updatedAt: f.created_at
                ? new Date(f.created_at).toLocaleDateString("en-US")
                : "Today",
            }));
          setFiles(mapped);
        }
      } catch (err: any) {
        console.error("Fetch documents error:", err);
        setErrorMessage(err.message || "Failed to fetch documents from Supabase.");
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fungsi Unduh Dokumen Publik
  const handleDownloadPublic = async (file: DocumentItem) => {
    if (!file.storage_path) {
      alert("Storage file path not found.");
      return;
    }

    setDownloadingId(file.id);
    try {
      // 1. Panggil Supabase Storage: download file publik dari bucket 'diary-files'
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
      a.download = file.file_name || file.name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke Object URL setelah unduhan dimulai
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    } catch (err: any) {
      console.error("Gagal mengunduh dokumen publik:", err);
      alert("Failed to download file: " + (err.message || err));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Documents" subtitle="PDF and other document files stored in MOYA" />

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
          <p className="text-sm text-moya-muted">No documents stored yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-xl2 border border-moya-border bg-moya-surface p-4 flex items-center justify-between gap-3 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-moya-soft flex items-center justify-center text-lg shrink-0">
                  📄
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium text-moya-text truncate"
                    title={file.file_name || file.name}
                  >
                    {file.file_name || file.name || "Untitled Document"}
                  </p>
                  <p className="text-xs text-moya-muted mt-0.5">
                    {file.size} · {file.updatedAt}
                  </p>
                </div>
              </div>

              {/* Tombol Unduh Dokumen */}
              <button
                type="button"
                onClick={() => handleDownloadPublic(file)}
                disabled={downloadingId === file.id}
                className="text-xs bg-moya-soft hover:bg-moya-primary hover:text-white text-moya-primarydark px-3 py-1.5 rounded-lg border border-moya-border font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                title="Download Document"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


