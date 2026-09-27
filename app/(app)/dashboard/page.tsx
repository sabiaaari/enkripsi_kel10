import Link from "next/link";
import NoteCard from "@/components/NoteCard";
import FileCard from "@/components/FileCard";
import { notes, files } from "@/lib/data";

export default function HomePage() {
  const recentNotes = notes.slice(0, 3);
  const pinnedNotes = notes.filter((n) => n.pinned);
  const recentFiles = files.slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <p className="text-moya-muted text-sm mb-1">Good to see you</p>
        <h1 className="font-display text-3xl text-moya-text">
          What are you keeping today?
        </h1>
      </div>

      <div className="relative mb-9">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-moya-muted">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search notes, files, anything…"
          className="w-full rounded-xl2 border border-moya-border bg-moya-surface pl-11 pr-4 py-3 text-sm text-moya-text placeholder:text-moya-muted focus-ring"
        />
      </div>

      {pinnedNotes.length > 0 && (
        <section className="mb-9">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-moya-text">📌 Pinned Notes</h2>
            <Link href="/notes/pinned" className="text-xs text-moya-primarydark hover:underline">
              See all
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {pinnedNotes.map((n) => (
              <NoteCard key={n.id} note={n} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-9">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-moya-text">Recent Notes</h2>
          <Link href="/notes" className="text-xs text-moya-primarydark hover:underline">
            See all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {recentNotes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-moya-text">Recently Uploaded</h2>
          <Link href="/files" className="text-xs text-moya-primarydark hover:underline">
            See all
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {recentFiles.map((f) => (
            <FileCard key={f.id} file={f} />
          ))}
        </div>
      </section>
    </div>
  );
}
