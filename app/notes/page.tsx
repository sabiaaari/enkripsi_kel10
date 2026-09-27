import PageHeader from "@/components/PageHeader";
import NoteCard from "@/components/NoteCard";
import DiaryForm from "@/components/DiaryForm";
import { notes } from "@/lib/data";

export default function AllNotesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="All Notes & Secret Diary"
        subtitle="Buat catatan baru, amankan dengan enkripsi modern AES-256-GCM, dan kelola catatan Anda"
      />

      <DiaryForm />

      <div className="pt-6 border-t border-moya-border space-y-4">
        <h3 className="font-display text-base text-moya-text">📚 Catatan Contoh (Arsip)</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      </div>
    </div>
  );
}

