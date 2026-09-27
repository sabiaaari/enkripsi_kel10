import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import FileCard from "@/components/FileCard";
import { files } from "@/lib/data";

const groups = [
  { type: "image" as const, label: "Images", href: "/files/images", icon: "🖼️" },
  { type: "document" as const, label: "Documents", href: "/files/documents", icon: "📄" },
  { type: "handwritten" as const, label: "Handwritten", href: "/files/handwritten", icon: "✍️" },
];

export default function FilesPage() {
  return (
    <div>
      <PageHeader title="Files" subtitle="Everything you've uploaded, kept in one place" />
      <div className="grid sm:grid-cols-3 gap-3 mb-9">
        {groups.map((g) => {
          const count = files.filter((f) => f.type === g.type).length;
          return (
            <Link
              key={g.type}
              href={g.href}
              className="rounded-xl2 border border-moya-border bg-moya-surface p-5 hover:shadow-card transition-shadow"
            >
              <div className="text-2xl mb-2">{g.icon}</div>
              <p className="text-moya-text font-medium">{g.label}</p>
              <p className="text-xs text-moya-muted mt-0.5">{count} files</p>
            </Link>
          );
        })}
      </div>

      <h2 className="font-display text-lg text-moya-text mb-3">Recently uploaded</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {files.slice(0, 4).map((f) => (
          <FileCard key={f.id} file={f} />
        ))}
      </div>
    </div>
  );
}
