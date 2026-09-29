import { FileItem } from "@/lib/data";

const typeIcon: Record<FileItem["type"], string> = {
  image: "🖼️",
  document: "📄",
};

export default function FileCard({ file }: { file: FileItem }) {
  return (
    <div className="rounded-xl2 border border-moya-border bg-moya-surface p-4 flex items-center gap-3 hover:shadow-card transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-moya-soft flex items-center justify-center text-lg shrink-0">
        {typeIcon[file.type]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-moya-text truncate break-words" title={file.file_name || file.name}>
          {file.file_name || file.name || "Untitled File"}
        </p>
        <p className="text-xs text-moya-muted mt-0.5">
          {file.size} · {file.updatedAt}
        </p>
      </div>
    </div>
  );
}
