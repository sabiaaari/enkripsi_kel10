"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";
import { decryptDiary } from "@/utils/crypto";
import { useMasterPassword } from "@/context/MasterPasswordContext";

export type PrivateNoteItem = {
  id: string;
  user_id?: string;
  title: string;
  is_encrypted: boolean;
  created_at?: string;
};

export default function PrivateNotesPage() {
  const { masterPassword, openModal } = useMasterPassword();
  const [notes, setNotes] = useState<PrivateNoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch daftar catatan privat dari Supabase
  const fetchPrivateNotes = useCallback(async () => {
    setIsLoading(true);
    setDbError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setDbError("Invalid user session. Please sign in first.");
        setNotes([]);
        return;
      }

      // Ambil seluruh data catatan privat milik pengguna
      const { data, error } = await supabase
        .from("diary_notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_encrypted", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows: any[] = data || [];

      // Resolusi judul catatan (jika master password ada di RAM dan judul masih default, dekripsi baris pertama untuk mengambil judul)
      const mappedNotes: PrivateNoteItem[] = await Promise.all(
        rows.map(async (row) => {
          let title = row.title;

          // Jika judul default atau belum diset dan masterPassword tersedia, coba ekstrak dari [Judul]
          if ((!title || title === "Secret Note" || title === "Untitled Note") && masterPassword && row.content) {
            try {
              const plain = await decryptDiary(
                row.content,
                row.salt,
                row.nonce || row.iv,
                masterPassword
              );
              if (plain.startsWith("[") && plain.includes("]\n\n")) {
                const endIdx = plain.indexOf("]\n\n");
                title = plain.slice(1, endIdx);
              }
            } catch (e) {
              // Abaikan jika dekripsi gagal di list
            }
          }

          return {
            id: String(row.id),
            user_id: row.user_id,
            title: title || "Secret Note",
            is_encrypted: true,
            created_at: row.created_at,
          };
        })
      );

      setNotes(mappedNotes);
    } catch (err: any) {
      console.error("Koneksi Supabase error saat memuat catatan:", err);
      setDbError(err.message || "Failed to fetch private notes from Supabase");
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [masterPassword]);

  useEffect(() => {
    fetchPrivateNotes();
  }, [fetchPrivateNotes]);

  // Hapus Catatan dari Supabase
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this private note?")) return;

    try {
      const { error } = await supabase.from("diary_notes").delete().eq("id", id);
      if (error) throw error;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      alert("Note deleted successfully.");
    } catch (err: any) {
      console.error("Gagal menghapus catatan privat:", err);
      alert("Failed to delete note: " + (err.message || err));
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Private Notes"
        />

        <Link
          href="/notes/new?private=true"
          className="px-4 py-2 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl text-xs font-semibold transition-colors shadow-card flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>+</span>
          <span>New Private Note</span>
        </Link>
      </div>

      {/* Info Error Supabase jika ada */}
      {dbError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <p>⚠️ {dbError}</p>
          <button
            onClick={() => fetchPrivateNotes()}
            className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Status Brankas Terkunci jika sandi belum diinput */}
      {!masterPassword && (
        <div className="p-6 bg-gradient-to-br from-moya-soft/90 via-purple-50/60 to-white border-2 border-dashed border-moya-border rounded-xl2 text-center space-y-3.5 shadow-soft animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-moya-soft text-moya-primarydark flex items-center justify-center text-xl mx-auto shadow-sm">
            🔒
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-medium text-base text-moya-text">
              Private Vault Locked
            </h3>
            <p className="text-xs text-moya-muted max-w-sm mx-auto">
              Your master password is needed to view titles and decrypt full contents.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="w-full sm:w-auto px-6 py-2.5 bg-moya-primary hover:bg-moya-primarydark text-white font-medium rounded-xl text-xs transition-all shadow-card hover:shadow-soft flex items-center justify-center gap-2 mx-auto active:scale-95 cursor-pointer"
          >
            <span>🔓</span>
            <span>Unlock Vault with Password</span>
          </button>
        </div>
      )}

      {/* Filter / Search Bar (Sesuai Halaman Public Notes) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search private notes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-moya-surface border border-moya-border rounded-xl text-xs text-moya-text placeholder:text-moya-muted focus-ring"
          />
          <span className="absolute left-3 top-2.5 text-xs text-moya-muted">🔍</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-moya-muted self-end sm:self-auto">
          <span>{filteredNotes.length} Notes</span>
          <button
            onClick={() => fetchPrivateNotes()}
            className="text-moya-primarydark hover:underline flex items-center gap-1 cursor-pointer"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* DAFTAR KARTU CATATAN PRIVAT: HANYA MENAMPILKAN JUDUL & TANGGAL (TANPA PREVIEW ISI TEKS) */}
      {isLoading ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <div className="animate-spin w-6 h-6 border-2 border-moya-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-moya-muted animate-pulse">
            Loading private notes...
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-moya-border rounded-xl2 bg-moya-surface space-y-3">
          <div className="text-3xl">🔒</div>
          <p className="text-sm text-moya-muted">
            {searchQuery ? "No private notes match your search." : "No private notes stored yet."}
          </p>
          <div className="pt-1">
            <Link
              href="/notes/new?private=true"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-moya-primary text-white text-xs font-medium rounded-xl hover:bg-moya-primarydark transition-colors shadow-card"
            >
              + Write New Private Note
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-moya-surface border border-moya-border p-5 rounded-xl2 shadow-card flex flex-col justify-between hover:border-moya-primarydark/40 hover:shadow-md transition-all group"
            >
              {/* Link ke Halaman Detail Catatan Dinamis (/private/notes/[id]) */}
              <Link
                href={`/private/notes/${note.id}`}
                className="block flex-1 space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span>🔒</span> Private Note
                  </span>
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

                {/* Hanya Menampilkan Judul Catatan Saja */}
                <h4 className="font-display font-medium text-base text-moya-text group-hover:text-moya-primarydark transition-colors line-clamp-2">
                  {note.title}
                </h4>
              </Link>

              {/* Footer Kartu & Tombol Aksi */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-moya-border text-xs">
                <Link
                  href={`/private/notes/${note.id}`}
                  className="text-moya-primarydark hover:underline font-medium text-xs flex items-center gap-1"
                >
                  <span>Open Note</span>
                  <span>→</span>
                </Link>

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
          ))}
        </div>
      )}
    </div>
  );
}
