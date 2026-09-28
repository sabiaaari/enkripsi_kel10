"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";
import { decryptDiary, decryptFileBuffer } from "@/utils/crypto";
import { useMasterPassword } from "@/context/MasterPasswordContext";

type FileRecord = {
  id: string;
  name: string;
  type: "image" | "document";
  size: string;
  updatedAt: string;
  is_private: boolean;
  content?: string;
  storage_path?: string;
  mime_type?: string;
  salt?: string;
  iv?: string;
  auth_tag?: string;
};

export default function FilesPage() {
  const { masterPassword, requestMasterPassword } = useMasterPassword();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // State untuk modal preview berkas yang didekripsi
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // 1. Tarik data dari Supabase tabel encrypted_files (hanya berkas publik is_encrypted === false)
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from("encrypted_files")
        .select("*")
        .eq("is_encrypted", false)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      } else if (data) {
        const mapped: FileRecord[] = data.map((f: any) => ({
          id: String(f.id),
          name: f.original_filename || f.name || "Untitled File",
          type:
            f.mime_type?.startsWith("image/") || f.type?.startsWith("image/") || f.type === "image"
              ? "image"
              : "document",
          size: f.file_size
            ? `${(f.file_size / 1024).toFixed(1)} KB`
            : f.size || "0 KB",
          updatedAt: f.created_at
            ? new Date(f.created_at).toLocaleDateString("en-US")
            : "Today",
          is_private: false,
          content: f.content,
          storage_path: f.storage_path,
          mime_type: f.mime_type || f.type,
          salt: f.salt,
          iv: f.nonce || f.iv,
          auth_tag: f.auth_tag,
        }));
        setFiles(mapped);
      }
    } catch (err: any) {
      console.error("Gagal mengambil data dari Supabase:", err);
      setDbError(err.message || "Failed to fetch files from Supabase.");
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // 2. Buka fail publik langsung tanpa fungsi dekripsi (is_encrypted === false)
  const handleOpenFile = async (file: FileRecord) => {
    if (!file.content && !file.storage_path) {
      alert("File has no content or storage path.");
      return;
    }

    try {
      let finalUrl = file.content || "";

      if (file.storage_path) {
        // Unduh berkas langsung dari Supabase Storage tanpa dekripsi
        const { data: fileBlob, error: dlError } = await supabase.storage
          .from("diary-files")
          .download(file.storage_path);

        if (dlError || !fileBlob) {
          throw dlError || new Error("Failed to download file from storage.");
        }

        finalUrl = URL.createObjectURL(fileBlob);
      }

      setPreviewFile({
        name: file.name,
        type: file.type,
        dataUrl: finalUrl,
      });
    } catch (err: any) {
      console.error("Gagal membuka berkas publik:", err);
      alert("Failed to open file: " + (err.message || err));
    }
  };


  return (
    <div>
      <PageHeader
        title="Files"
        subtitle="All public files uploaded to MOYA (unencrypted)"
      />


      {/* Pesan Error Supabase jika gagal */}
      {dbError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl2 text-xs text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
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

      {/* Recently uploaded */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg text-moya-text">Recently uploaded</h2>
        <Link
          href="/files/upload"
          className="text-xs text-moya-primarydark hover:underline font-medium"
        >
          + Upload File
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <div className="animate-spin w-6 h-6 border-2 border-moya-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-moya-muted">Loading data...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <p className="text-sm text-moya-muted mb-3">No files uploaded yet.</p>
          <Link
            href="/files/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-moya-primary text-white text-xs font-medium rounded-xl hover:bg-moya-primarydark transition-colors shadow-card"
          >
            + Upload New File
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {files.map((f) => (
            <div
              key={f.id}
              className="rounded-xl2 border border-moya-border bg-moya-surface p-4 flex items-center justify-between gap-3 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-moya-soft flex items-center justify-center text-lg shrink-0">
                  {f.type === "image" ? "🖼️" : f.type === "document" ? "📄" : "✍️"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-moya-text truncate">
                    {f.name}
                  </p>
                  <p className="text-xs text-moya-muted mt-0.5">
                    {f.size} · {f.updatedAt}
                  </p>
                </div>
              </div>

              {/* Render Tombol Aksi Berkas Terbuka — Tanpa Ikon Gembok */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Public
                </span>
                <button
                  onClick={() => handleOpenFile(f)}
                  className="text-xs bg-moya-primary hover:bg-moya-primarydark text-white px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-card"
                >
                  <span>👁️</span> Open File
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview Berkas yang Didekripsi */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-moya-surface border border-moya-border rounded-xl2 shadow-soft max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-moya-border pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🔓</span>
                <h3 className="font-display text-lg text-moya-text truncate">
                  {previewFile.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-moya-muted hover:text-moya-text text-sm p-1.5 rounded-lg hover:bg-moya-soft"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center min-h-[250px] bg-moya-bg rounded-xl p-4">
              {previewFile.type === "image" || previewFile.dataUrl.startsWith("data:image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewFile.dataUrl}
                  alt={previewFile.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-card"
                />
              ) : (
                <div className="text-center space-y-3">
                  <div className="text-4xl">📄</div>
                  <p className="text-xs text-moya-muted">
                    Decrypted document preview available for download.
                  </p>
                  <a
                    href={previewFile.dataUrl}
                    download={previewFile.name}
                    className="inline-block px-4 py-2 bg-moya-primary text-white text-xs font-medium rounded-xl hover:bg-moya-primarydark transition-colors shadow-card"
                  >
                    Download File ({previewFile.name})
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 text-xs font-medium bg-moya-soft hover:bg-moya-border text-moya-text rounded-xl transition-colors"
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
