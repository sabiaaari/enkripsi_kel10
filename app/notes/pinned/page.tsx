"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import NoteCard from "@/components/NoteCard";
import type { Note } from "@/lib/data";
import { supabase } from "@/utils/supabase";

export default function PinnedNotesPage() {
  const [pinned, setPinned] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        let query = supabase
          .from("diary_notes")
          .select("*")
          .eq("is_pinned", true)
          .eq("is_encrypted", false)
          .order("created_at", { ascending: false });

        let { data, error } = await query;

        // Fallback jika kolom is_pinned belum ada
        if (error && (error.message?.includes("is_pinned") || error.code === "42703")) {
          const fallback = await supabase
            .from("diary_notes")
            .select("*")
            .eq("pinned", true)
            .eq("is_encrypted", false)
            .order("created_at", { ascending: false });
          data = fallback.data;
          error = fallback.error;
        }

        if (error) {
          console.error("Gagal mengambil catatan tersemat:", error.message);
        } else if (data) {
          const mapped: Note[] = data.map((row: any) => {
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

            // Normalisasi kategori
            const catRaw = (row.category || row.folder_id || "").toLowerCase();
            let normalizedCat: "College" | "Ideas" | "Personal" = "Personal";
            if (catRaw === "college" || catRaw === "kuliah") {
              normalizedCat = "College";
            } else if (catRaw === "ideas" || catRaw === "pekerjaan") {
              normalizedCat = "Ideas";
            } else {
              normalizedCat = "Personal";
            }

            return {
              id: String(row.id),
              title: displayTitle || "Untitled",
              excerpt:
                row.excerpt ||
                (displayBody
                  ? displayBody.replace(/<[^>]*>?/gm, "").slice(0, 100)
                  : "No content"),
              category: normalizedCat,
              pinned: true,
              updatedAt: row.updated_at
                ? new Date(row.updated_at).toLocaleDateString("en-US")
                : row.created_at
                ? new Date(row.created_at).toLocaleDateString("en-US")
                : "Just now",
              color: (row.color as "pink" | "sage" | "butter" | "primary") || "primary",
            };
          });
          setPinned(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <PageHeader title="Pinned" subtitle="Notes you have pinned for quick access" />
      {isLoading ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <div className="animate-spin w-6 h-6 border-2 border-moya-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-moya-muted">Loading notes...</p>
        </div>
      ) : pinned.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {pinned.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <p className="text-moya-muted text-sm">
            No pinned notes yet.
          </p>
        </div>
      )}
    </div>
  );
}
