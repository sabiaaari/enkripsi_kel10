import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { files } from "@/lib/data";

export default function HandwrittenPage() {
  const items = files.filter((f) => f.type === "handwritten");
  return (
    <div>
      <PageHeader
        title="Handwritten"
        subtitle="Photos of paper notes — the ones from class, or a napkin idea"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((f) => (
          <FileCard key={f.id} file={f} />
        ))}
      </div>
    </div>
  );
}
