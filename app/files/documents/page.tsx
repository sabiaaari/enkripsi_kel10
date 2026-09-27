import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { files } from "@/lib/data";

export default function DocumentsPage() {
  const items = files.filter((f) => f.type === "document");
  return (
    <div>
      <PageHeader title="Documents" subtitle="PDFs and other files worth keeping" />
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((f) => (
          <FileCard key={f.id} file={f} />
        ))}
      </div>
    </div>
  );
}
