"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NoteCard from "@/components/NoteCard";
import FileCard from "@/components/FileCard";
import type { Note, FileItem } from "@/lib/data";
import { supabase } from "@/utils/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Panggil fetchData() dan dengarkan perubahan sesi (onAuthStateChange) saat komponen dimuat
  useEffect(() => {
    // Listener sesi: mendengarkan perubahan status autentikasi (verifikasi email, login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    async function fetchData() {
      setLoading(true);
      try {
        // Ambil data user yang sedang login
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);

        // 1. Ambil data catatan publik dari tabel 'diary_notes' di Supabase
        const { data: diaryData, error: diaryError } = await supabase
          .from("diary_notes")
          .select("*")
          .eq("is_encrypted", false)
          .order("created_at", { ascending: false });

        if (diaryError) {
          console.warn("Info query diary_notes:", diaryError.message);
        } else if (diaryData) {
          // Petakan (map) hasil respons Supabase ke dalam state React
          const mappedNotes: Note[] = diaryData.map((row: any) => {
            let displayTitle = row.title;
            let displayBody = row.content || "";

            // Ekstrak judul jika teks dikemas dengan format [Judul]\n\nKonten
            if (!displayTitle && displayBody) {
              if (displayBody.startsWith("[") && displayBody.includes("]\n\n")) {
                const endIdx = displayBody.indexOf("]\n\n");
                displayTitle = displayBody.slice(1, endIdx);
                displayBody = displayBody.slice(endIdx + 3);
              } else if (displayBody.includes("\n\n")) {
                const parts = displayBody.split("\n\n");
                displayTitle = parts[0];
                displayBody = parts.slice(1).join("\n\n");
              }
            }

            return {
              id: String(row.id),
              title: displayTitle || row.title || "Untitled",
              excerpt:
                row.excerpt ||
                (displayBody
                  ? displayBody.replace(/<[^>]*>?/gm, "").slice(0, 100)
                  : "No content"),
              category: (row.category as "College" | "Ideas" | "Personal") || "Personal",
              pinned: Boolean(row.is_pinned ?? row.pinned),
              updatedAt: row.updated_at
                ? new Date(row.updated_at).toLocaleDateString("en-US")
                : row.created_at
                ? new Date(row.created_at).toLocaleDateString("en-US")
                : "Just now",
              color: (row.color as "pink" | "sage" | "butter" | "primary") || "primary",
            };
          });
          setNotes(mappedNotes);
        }

        // 2. Ambil data berkas publik dari tabel 'encrypted_files' di Supabase
        const { data: filesData, error: filesError } = await supabase
          .from("encrypted_files")
          .select("*")
          .eq("is_encrypted", false)
          .order("created_at", { ascending: false })
          .limit(3);

        if (filesError) {
          console.warn("Info query encrypted_files:", filesError.message);
        } else if (filesData) {
          const mappedFiles: FileItem[] = filesData.map((f: any) => {
            const fileName = f.original_filename || f.file_name || f.name || "Untitled File";
            return {
              id: String(f.id),
              name: fileName,
              file_name: fileName,
              type:
                f.mime_type?.startsWith("image/") || f.type?.startsWith("image/")
                  ? "image"
                  : "document",
              size: f.file_size
                ? `${(f.file_size / 1024).toFixed(1)} KB`
                : f.size || "1.0 MB",
              updatedAt: f.created_at
                ? new Date(f.created_at).toLocaleDateString("en-US")
                : "Today",
            };
          });
          setFiles(mappedFiles);
        }
      } catch (err) {
        console.error("Gagal mengambil data dari Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
    router.push("/");
    router.refresh();
  };

  // Filter pencarian
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const recentNotes = filteredNotes.slice(0, 4);

  return (
    <div>
      {/* Header Dashboard & User Status */}
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-moya-muted text-xs sm:text-sm mb-1">
            {user ? `Hello, ${user.email?.split("@")[0]} 👋` : "Welcome to MOYA"}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-moya-text break-words">
            What are you keeping today?
          </h1>
        </div>

        <div className="self-start md:self-auto">
          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs bg-moya-soft text-moya-primarydark px-3 py-1.5 rounded-xl border border-moya-border truncate max-w-[220px] sm:max-w-xs" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs bg-moya-primary hover:bg-moya-primarydark text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-card"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs bg-moya-surface hover:bg-moya-soft text-moya-text px-4 py-2 rounded-xl border border-moya-border font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Input Pencarian */}
      <div className="relative mb-7 md:mb-9">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-moya-muted">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search note title or content…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl2 border border-moya-border bg-moya-surface pl-11 pr-4 py-3 text-sm text-moya-text placeholder:text-moya-muted focus-ring"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <p className="text-sm text-moya-muted animate-pulse">
            Loading notes...
          </p>
        </div>
      ) : (
        <>
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <section className="mb-9">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg text-moya-text">📌 Pinned Notes</h2>
                <Link
                  href="/notes"
                  className="text-xs text-moya-primarydark hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {pinnedNotes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            </section>
          )}

          {/* Recent Notes Section (Data Asli Supabase) */}
          <section className="mb-9">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg text-moya-text">
                Recent Notes
              </h2>
              <Link href="/notes" className="text-xs text-moya-primarydark hover:underline">
                View all
              </Link>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface p-6">
                <p className="text-sm text-moya-muted">
                  No notes yet.
                </p>
                <Link
                  href="/notes"
                  className="inline-block mt-3 text-xs bg-moya-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-moya-primarydark transition-colors shadow-card"
                >
                  + Write New Note
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {recentNotes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            )}
          </section>

          {/* Recently Uploaded Files Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg text-moya-text">Recently Uploaded</h2>
              <Link href="/files/documents" className="text-xs text-moya-primarydark hover:underline">
                View all
              </Link>
            </div>
            {files.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-moya-border rounded-xl2 bg-moya-surface p-4">
                <p className="text-xs text-moya-muted">
                  No files uploaded yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {files.map((f) => (
                  <FileCard key={f.id} file={f} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
