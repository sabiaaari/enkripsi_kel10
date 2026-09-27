import PageHeader from "@/components/PageHeader";
import NoteCard from "@/components/NoteCard";
import { notes } from "@/lib/data";

export default function PinnedNotesPage() {
  const pinned = notes.filter((n) => n.pinned);
  return (
    <div>
      <PageHeader title="Pinned" subtitle="The ones you didn't want to lose in the scroll" />
      {pinned.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {pinned.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      ) : (
        <p className="text-moya-muted text-sm">
          Nothing pinned yet — tap 📌 on a note to keep it here.
        </p>
      )}
    </div>
  );
}
