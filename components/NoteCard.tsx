import Link from "next/link";
import { Note, colorMap } from "@/lib/data";

export default function NoteCard({ note }: { note: Note }) {
  const c = colorMap[note.color] || colorMap.primary;
  return (
    <Link
      href={`/notes/${note.id}`}
      className={`
        block rounded-xl2 border border-moya-border bg-moya-surface p-4
        hover:shadow-card hover:border-moya-primarydark/30 transition-all cursor-pointer group
        ${note.pinned ? "border-dashed" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-base sm:text-lg text-moya-text leading-snug group-hover:text-moya-primarydark transition-colors line-clamp-1 break-words">
          {note.title || "Untitled"}
        </h3>
        {note.pinned && <span title="Pinned" aria-label="Pinned" className="shrink-0">📌</span>}
      </div>
      <p className="text-xs sm:text-sm text-moya-muted leading-relaxed line-clamp-2 break-words">
        {note.excerpt}
      </p>
      <div className="flex items-center justify-between mt-4">
        <span
          className={`text-xs px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}
        >
          {note.category}
        </span>
        <span className="text-xs text-moya-muted shrink-0">{note.updatedAt}</span>
      </div>
    </Link>
  );
}
