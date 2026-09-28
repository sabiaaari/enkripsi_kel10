"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import NoteCard from "@/components/NoteCard";
import { categoryMeta, colorMap, type Note } from "@/lib/data";
import { supabase } from "@/utils/supabase";

export default function CategoriesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const categories = Object.keys(categoryMeta) as (keyof typeof categoryMeta)[];

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("diary_notes")
          .select("*")
          .eq("is_encrypted", false)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Gagal mengambil catatan kategori:", error.message);
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

            // Normalisasi kategori agar cocok dengan keys categoryMeta
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
              pinned: Boolean(row.pinned),
              updatedAt: row.updated_at
                ? new Date(row.updated_at).toLocaleDateString("en-US")
                : row.created_at
                ? new Date(row.created_at).toLocaleDateString("en-US")
                : "Just now",
              color: (row.color as "pink" | "sage" | "butter" | "primary") || "primary",
            };
          });
          setNotes(mapped);
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
      <PageHeader title="Categories" subtitle="Notes, sorted into the piles they belong to" />
      {isLoading ? (
        <div className="text-center py-12 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <div className="animate-spin w-6 h-6 border-2 border-moya-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-moya-muted">Loading data...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-9">
          {categories.map((cat) => {
            const items = notes.filter((n) => n.category === cat);
            const meta = categoryMeta[cat];
            const c = colorMap[meta.color];
            return (
              <section key={cat}>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  <h2 className="font-display text-lg text-moya-text">{cat}</h2>
                  <span className="text-xs text-moya-muted">· {items.length}</span>
                </div>
                <p className="text-sm text-moya-muted mb-3">{meta.description}</p>
                {items.length === 0 ? (
                  <p className="text-xs text-moya-muted italic mb-4">
                    No notes in this category yet.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {items.map((n) => (
                      <NoteCard key={n.id} note={n} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
