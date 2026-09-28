"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";

export type NoteDetail = {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  is_encrypted: boolean;
  is_pinned: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function NoteDetailPage({
  params,
}: {
  params?: { id: string };
}) {
  const router = useRouter();
  const routeParams = useParams();
  // Mengambil id dari prop params atau hook useParams
  const noteId = params?.id || (routeParams?.id as string);

  const [note, setNote] = useState<NoteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fungsi Fetch Catatan Berdasarkan ID dari Supabase
  const fetchNoteDetail = useCallback(async () => {
    if (!noteId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Query Supabase: .select('*').eq('id', params.id).single()
      const { data, error: fetchError } = await supabase
        .from("diary_notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (fetchError) {
        console.error("Gagal mengambil data catatan dari Supabase:", fetchError);
        throw fetchError;
      }

      if (!data) {
        throw new Error("Note not found.");
      }

      // Format judul dan isi jika dikemas dalam format [Judul]\n\nKonten
      let displayTitle = data.title;
      let displayBody = data.content || "";

      if (!displayTitle && displayBody) {
        if (displayBody.startsWith("[") && displayBody.includes("]\n\n")) {
          const endIdx = displayBody.indexOf("]\n\n");
          displayTitle = displayBody.slice(1, endIdx);
          displayBody = displayBody.slice(endIdx + 3);
        } else if (displayBody.includes("\n\n")) {
          const parts = displayBody.split("\n\n");
          displayTitle = parts[0];
          displayBody = parts.slice(1).join("\n\n");
        } else {
          displayTitle = "Note";
        }
      }

      setNote({
        id: String(data.id),
        user_id: data.user_id,
        title: displayTitle || "Untitled Note",
        content: displayBody,
        is_encrypted: Boolean(data.is_encrypted),
        is_pinned: Boolean(data.is_pinned ?? data.pinned ?? false),
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (err: any) {
      console.error("Terjadi error saat mengambil detail catatan:", err);
      setError(err.message || "Failed to load note");
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchNoteDetail();
  }, [fetchNoteDetail]);

  // Toggle status sematkan (Pin / Unpin)
  const handleTogglePin = async () => {
    if (!note) return;
    const nextStatus = !note.is_pinned;

    setNote((prev) => (prev ? { ...prev, is_pinned: nextStatus } : null));

    try {
      const { error: updateError } = await supabase
        .from("diary_notes")
        .update({ is_pinned: nextStatus })
        .eq("id", note.id);

      if (updateError) {
        if (updateError.message?.includes("is_pinned") || updateError.code === "42703") {
          const { error: fbErr } = await supabase
            .from("diary_notes")
            .update({ pinned: nextStatus })
            .eq("id", note.id);
          if (fbErr) throw fbErr;
        } else {
          throw updateError;
        }
      }
    } catch (err: any) {
      console.error("Gagal mengubah status pin:", err);
      setNote((prev) => (prev ? { ...prev, is_pinned: !nextStatus } : null));
      alert("Failed to toggle pin: " + (err.message || err));
    }
  };

  // Hapus Catatan dari Supabase
  const handleDeleteNote = async () => {
    if (!note) return;
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("diary_notes")
        .delete()
        .eq("id", note.id);

      if (deleteError) throw deleteError;

      alert("Note successfully deleted.");
      router.push("/notes");
    } catch (err: any) {
      console.error("Gagal menghapus catatan:", err);
      alert("Failed to delete note: " + (err.message || err));
    }
  };

  // Salin isi catatan ke clipboard
  const handleCopyNote = () => {
    if (!note) return;
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Navigasi Kembali & Aksi Atas */}
      <div className="flex items-center justify-between">
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 text-xs font-medium text-moya-muted hover:text-moya-primarydark transition-colors px-3 py-1.5 rounded-lg bg-moya-surface border border-moya-border hover:border-moya-primarydark/30 shadow-xs"
        >
          <span>←</span> Back to Notes
        </Link>

        {note && !isLoading && !error && (
          <div className="flex items-center gap-2">
            {/* Tombol Pin / Unpin */}
            <button
              onClick={handleTogglePin}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                note.is_pinned
                  ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 shadow-xs font-medium"
                  : "bg-moya-surface border-moya-border hover:bg-moya-soft text-moya-text"
              }`}
              title={note.is_pinned ? "Unpin note" : "Pin note to top"}
            >
              <span>📌</span>
              <span>{note.is_pinned ? "Pinned" : "Pin"}</span>
            </button>

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
          <p className="text-sm text-moya-muted animate-pulse">Loading note details...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl2 text-center space-y-3">
          <div className="text-2xl">⚠️</div>
          <h3 className="font-semibold text-red-900 text-sm">Failed to Display Note</h3>
          <p className="text-xs text-red-700">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => fetchNoteDetail()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Detail Konten Catatan Penuh */}
      {!isLoading && !error && note && (
        <article className="bg-moya-surface border border-moya-border rounded-xl2 p-6 sm:p-10 shadow-card space-y-6">
          {/* Header Catatan */}
          <div className="border-b border-moya-border pb-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge Pinned */}
              {note.is_pinned && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs animate-in fade-in">
                  <span>📌</span> Pinned
                </span>
              )}
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <span>📝</span> Public
              </span>
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

          {/* Isi Konten Catatan Lengkap */}
          <div className="text-moya-text text-base sm:text-[17px] leading-relaxed whitespace-pre-wrap font-sans bg-moya-bg/50 p-5 sm:p-7 rounded-xl border border-moya-border/60">
            {note.content}
          </div>
        </article>
      )}
    </div>
  );
}
