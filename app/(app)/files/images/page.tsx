import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { files } from "@/lib/data";

export default function ImagesPage() {
  const items = files.filter((f) => f.type === "image");
  return (
    <div>
      <PageHeader title="Images" subtitle="Photos and pictures you've saved to MOYA" />
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((f) => (
          <FileCard key={f.id} file={f} />
        ))}
      </div>
    </div>
  );
}
