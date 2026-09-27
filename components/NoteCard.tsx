import { Note, colorMap } from "@/lib/data";

export default function NoteCard({ note }: { note: Note }) {
  const c = colorMap[note.color];
  return (
    <div
      className={`
        rounded-xl2 border border-moya-border bg-moya-surface p-4
        hover:shadow-card transition-shadow
        ${note.pinned ? "border-dashed" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-lg text-moya-text leading-snug">
          {note.title}
        </h3>
        {note.pinned && <span title="Pinned" aria-label="Pinned">📌</span>}
      </div>
      <p className="text-sm text-moya-muted leading-relaxed line-clamp-2">
        {note.excerpt}
      </p>
      <div className="flex items-center justify-between mt-4">
        <span
          className={`text-xs px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}
        >
          {note.category}
        </span>
        <span className="text-xs text-moya-muted">{note.updatedAt}</span>
      </div>
    </div>
  );
}
