import PageHeader from "@/components/PageHeader";
import NoteCard from "@/components/NoteCard";
import { notes } from "@/lib/data";

export default function AllNotesPage() {
  return (
    <div>
      <PageHeader title="All Notes" subtitle={`${notes.length} notes, exactly as you left them`} />
      <div className="grid sm:grid-cols-2 gap-3">
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>
    </div>
  );
}
