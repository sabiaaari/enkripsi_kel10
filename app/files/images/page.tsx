"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";

// Fungsi utilitas format ukuran fail dari byte ke KB / MB
function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type PublicImageItem = {
  id: string;
  name: string;
  file_name?: string;
  type: "image";
  size: string;
  storage_path?: string;
  publicUrl: string;
  updatedAt: string;
};

export default function ImagesPage() {
  const [files, setFiles] = useState<PublicImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<PublicImageItem | null>(null);

  // Fungsi fetchPublicImages: mengambil gambar publik dan mendapatkan URL publik Supabase Storage
  const fetchPublicImages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Filter Privasi Supabase & Filter Tipe MIME Gambar
      let query = supabase
        .from("encrypted_files")
        .select("*")
        .eq("is_encrypted", false)
        .ilike("mime_type", "%image%")
        .order("created_at", { ascending: false });

      let { data, error } = await query;

      // Fallback jika database menggunakan kolom 'file_type'
      if (error && error.message?.includes("does not exist")) {
        const fallback = await supabase
          .from("encrypted_files")
          .select("*")
          .eq("is_encrypted", false)
          .like("file_type", "%image%")
          .order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        throw error;
      } else if (data) {
        // 2. Dapatkan URL Gambar Publik menggunakan supabase.storage.from(...).getPublicUrl(...)
        const mapped: PublicImageItem[] = data.map((img: any) => {
          const { data: urlData } = supabase.storage
            .from("diary-files")
            .getPublicUrl(img.storage_path || "");

          return {
            id: String(img.id),
            name: img.file_name || img.original_filename || img.name || "Untitled Image",
            file_name: img.file_name || img.original_filename || img.name || "Untitled Image",
            type: "image" as const,
            size: formatFileSize(img.file_size || img.size),
            storage_path: img.storage_path,
            publicUrl: urlData?.publicUrl || "",
            updatedAt: img.created_at
              ? new Date(img.created_at).toLocaleDateString("en-US")
              : "Today",
          };
        });

        setFiles(mapped);
      }
    } catch (err: any) {
      console.error("Fetch images error:", err);
      setErrorMessage(err.message || "Failed to fetch images from Supabase.");
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicImages();
  }, [fetchPublicImages]);

  return (
    <div>
      {/* Header Halaman Galeri Gambar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Images"
          subtitle="Photos and gallery images stored in MOYA"
        />

        <div className="flex items-center gap-2.5">
          <Link
            href="/settings/crypto-lab"
            className="px-3.5 py-2 bg-moya-surface hover:bg-moya-soft border border-moya-border text-moya-text rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Open Cryptography Lab for ECB vs GCM demonstration"
          >
            <span>🔬</span>
            <span>Crypto Lab</span>
          </Link>
          <Link
            href="/files/upload"
            className="px-4 py-2 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl text-xs font-semibold transition-colors shadow-card flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Upload Image</span>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl2 text-xs text-red-800 flex items-center justify-between">
          <p>
            ⚠️ <strong>Supabase Error:</strong> {errorMessage}
          </p>
        </div>
      )}

      {/* DAFTAR GAMBAR YANG TERSIMPAN (GRID GALERI) */}
      {isLoading ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <div className="animate-spin w-6 h-6 border-2 border-moya-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-moya-muted">Loading image gallery...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-moya-border rounded-xl2 bg-moya-surface space-y-3">
          <div className="text-3xl">🖼️</div>
          <p className="text-base font-medium text-moya-text">No images stored yet.</p>
          <p className="text-xs text-moya-muted max-w-sm mx-auto">
            Upload images from the Upload menu to see them appear in this gallery.
          </p>
          <div className="pt-2">
            <Link
              href="/files/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-moya-primary text-white text-xs font-medium rounded-xl hover:bg-moya-primarydark transition-colors shadow-card"
            >
              + Upload New Image
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((image) => (
            <div
              key={image.id}
              className="rounded-xl2 border border-moya-border bg-moya-surface overflow-hidden hover:shadow-card transition-shadow flex flex-col group"
            >
              {/* Wadah Gambar / Thumbnail */}
              <div
                onClick={() => setPreviewModalImage(image)}
                className="relative aspect-square bg-moya-bg overflow-hidden flex items-center justify-center cursor-pointer"
                title="Click to view full image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.publicUrl}
                  alt={image.file_name || image.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = "0.4";
                  }}
                />
              </div>

              {/* Judul/Nama Fail dan Info di Bawah Gambar */}
              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <p
                    className="text-sm font-medium text-moya-text truncate"
                    title={image.file_name || image.name}
                  >
                    {image.file_name || image.name}
                  </p>
                  <p className="text-xs text-moya-muted mt-0.5">
                    {image.size} · {image.updatedAt}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-moya-border/60 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Public
                  </span>
                  <a
                    href={image.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-moya-primarydark hover:underline font-medium text-xs flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview Gambar Penuh */}
      {previewModalImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="bg-moya-surface border border-moya-border rounded-xl2 shadow-soft max-w-3xl w-full p-5 space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-moya-border pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🖼️</span>
                <h3 className="font-display text-base text-moya-text truncate">
                  {previewModalImage.file_name || previewModalImage.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="text-moya-muted hover:text-moya-text text-sm p-1.5 rounded-lg hover:bg-moya-soft"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center min-h-[300px] max-h-[65vh] bg-black/5 rounded-xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModalImage.publicUrl}
                alt={previewModalImage.file_name || previewModalImage.name}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-card"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-moya-muted">
                {previewModalImage.size} · {previewModalImage.updatedAt}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalImage.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewModalImage.file_name || previewModalImage.name}
                  className="px-3.5 py-1.5 bg-moya-primary text-white text-xs font-medium rounded-xl hover:bg-moya-primarydark transition-colors shadow-card"
                >
                  Download / Full View ↗
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="px-3.5 py-1.5 text-xs font-medium bg-moya-soft hover:bg-moya-border text-moya-text rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
