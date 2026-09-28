"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";

export type PublicNote = {
  id: string;
  user_id?: string;
  title?: string;
  content: string; // Teks asli plaintext
  is_encrypted: boolean;
  is_pinned: boolean;
  created_at?: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Logika Pengambilan Data Catatan Terbuka (is_encrypted === false)
  // Diurutkan berdasarkan status pin terlebih dahulu (is_pinned descending), lalu tanggal terbaru (created_at descending)
  const fetchPublicNotes = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    try {
      // Sorting Query: .order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
      let query = supabase
        .from("diary_notes")
        .select("*")
        .eq("is_encrypted", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      let { data, error } = await query;

      // Fallback anggun jika kolom is_pinned belum dibuat di Supabase
      if (error && (error.message?.includes("is_pinned") || error.code === "42703")) {
        const fallbackQuery = await supabase
          .from("diary_notes")
          .select("*")
          .eq("is_encrypted", false)
          .order("created_at", { ascending: false });
        data = fallbackQuery.data;
        error = fallbackQuery.error;
      }

      if (error) {
        console.error("Gagal memuat catatan publik dari Supabase:", error);
        throw error;
      }

      const rows: PublicNote[] = (data || []).map((row: any) => {
        let displayTitle = row.title;
        let displayBody = row.content || "";

        // Ekstrak judul jika teks dikemas dengan [Judul]\n\nKonten
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

        return {
          id: String(row.id),
          user_id: row.user_id,
          title: displayTitle || "Untitled Note",
          content: displayBody,
          is_encrypted: false,
          is_pinned: Boolean(row.is_pinned ?? row.pinned ?? false),
          created_at: row.created_at,
        };
      });

      setNotes(rows);
    } catch (err: any) {
      console.error("Error saat fetch catatan:", err);
      setDbError(err.message || "Failed to fetch notes from Supabase");
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicNotes();
  }, [fetchPublicNotes]);

  // 2. Aksi Toggle Pin / Unpin Catatan
  const handleTogglePin = async (id: string, currentPinStatus: boolean) => {
    const nextStatus = !currentPinStatus;

    // Pembaruan UI Optimistik (langsung urutkan catatan tersemat ke bagian teratas)
    setNotes((prev) =>
      prev
        .map((n) => (n.id === id ? { ...n, is_pinned: nextStatus } : n))
        .sort((a, b) => {
          if (a.is_pinned === b.is_pinned) {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          }
          return a.is_pinned ? -1 : 1;
        })
    );

    try {
      // 1. Coba update kolom 'is_pinned' di Supabase
      const { error: updateError } = await supabase
        .from("diary_notes")
        .update({ is_pinned: nextStatus })
        .eq("id", id);

      if (updateError) {
        // Fallback jika nama kolom di tabel adalah 'pinned'
        if (updateError.message?.includes("is_pinned") || updateError.code === "42703") {
          const { error: fbErr } = await supabase
            .from("diary_notes")
            .update({ pinned: nextStatus })
            .eq("id", id);
          if (fbErr) throw fbErr;
        } else {
          throw updateError;
        }
      }
    } catch (err: any) {
      console.error("Gagal mengubah status pin:", err);
      // Revert state jika terjadi kesalahan
      setNotes((prev) =>
        prev
          .map((n) => (n.id === id ? { ...n, is_pinned: currentPinStatus } : n))
          .sort((a, b) => {
            if (a.is_pinned === b.is_pinned) {
              return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            }
            return a.is_pinned ? -1 : 1;
          })
      );
      alert(
        "Failed to update pin status. Please ensure the 'is_pinned' column exists in Supabase 'diary_notes' table.\n\nError: " +
          (err.message || err)
      );
    }
  };

  // Hapus catatan terbuka
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this note from Supabase?")) return;
    try {
      const { error } = await supabase.from("diary_notes").delete().eq("id", id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      console.error("Gagal menghapus:", err);
      alert("Failed to delete note: " + (err.message || err));
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      (n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Public Notes"
        />

        <Link
          href="/notes/new?private=false"
          className="px-4 py-2 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl text-xs font-semibold transition-colors shadow-card flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>+</span>
          <span>New Note</span>
        </Link>
      </div>

      {/* Pesan Error Supabase jika ada */}
      {dbError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-3">
          <p>⚠️ {dbError}</p>
          <button
            onClick={() => fetchPublicNotes()}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-medium cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-moya-surface border border-moya-border rounded-xl text-xs text-moya-text placeholder:text-moya-muted focus-ring"
          />
          <span className="absolute left-3 top-2.5 text-xs text-moya-muted">🔍</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-moya-muted self-end sm:self-auto">
          <span>{filteredNotes.length} Notes</span>
          <button
            onClick={() => fetchPublicNotes()}
            className="text-moya-primarydark hover:underline flex items-center gap-1 cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* DAFTAR CATATAN TERBUKA DENGAN DUKUNGAN PINNED NOTES */}
      {isLoading ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <p className="text-sm text-moya-muted animate-pulse">
            Loading notes...
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface space-y-3">
          <div className="text-3xl">📝</div>
          <p className="text-sm text-moya-muted">
            {searchQuery
              ? "No notes match your search."
              : "No notes saved yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`rounded-xl2 p-5 shadow-card flex flex-col justify-between hover:shadow-md transition-all group ${
                note.is_pinned
                  ? "bg-gradient-to-b from-amber-50/50 via-amber-50/20 to-moya-surface border-2 border-amber-300 shadow-amber-100/50 ring-1 ring-amber-200/50"
                  : "bg-moya-surface border border-moya-border hover:border-moya-primarydark/40"
              }`}
            >
              {/* Link ke Halaman Detail Catatan */}
              <Link
                href={`/notes/${note.id}`}
                className="block flex-1 space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Badge Pinned Menyala */}
                    {note.is_pinned && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs animate-in fade-in">
                        <span>📌</span> Pinned
                      </span>
                    )}
                    {/* Badge Publik */}
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <span>📝</span> Public
                    </span>
                  </div>

                  <span className="text-[11px] text-moya-muted">
                    {note.created_at
                      ? new Date(note.created_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Today"}
                  </span>
                </div>

                <h4 className="font-display font-medium text-base text-moya-text group-hover:text-moya-primarydark transition-colors line-clamp-1">
                  {note.title}
                </h4>

                {/* Pemotongan Teks (Truncate) Preview maksimal 3 baris */}
                <p className="text-sm text-moya-muted bg-moya-bg p-3.5 rounded-xl border border-moya-border leading-relaxed whitespace-pre-wrap line-clamp-3 overflow-hidden">
                  {note.content}
                </p>
              </Link>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-moya-border text-xs">
                {/* Tombol Aksi Pin / Unpin */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePin(note.id, note.is_pinned);
                  }}
                  title={note.is_pinned ? "Unpin note" : "Pin note to top"}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    note.is_pinned
                      ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 font-medium shadow-xs"
                      : "bg-moya-bg text-moya-muted hover:text-moya-text border-moya-border hover:bg-moya-soft"
                  }`}
                >
                  <span>📌</span>
                  <span>{note.is_pinned ? "Pinned" : "Pin"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
                      alert("Note content copied to clipboard!");
                    }}
                    className="text-moya-muted hover:text-moya-text text-[11px] px-2.5 py-1 rounded bg-moya-bg border border-moya-border transition-colors cursor-pointer"
                  >
                    📋 Copy
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-[11px] px-2.5 py-1 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
