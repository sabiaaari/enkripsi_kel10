import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PrivateGate from "@/components/PrivateGate";

export default function PrivatePage() {
  return (
    <div>
      <PageHeader title="Private" subtitle="Kept a little more to yourself" />
      <PrivateGate>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/private/notes"
            className="rounded-xl2 border border-moya-border border-dashed bg-moya-surface p-5 hover:shadow-card transition-shadow"
          >
            <div className="text-2xl mb-2">📝</div>
            <p className="text-moya-text font-medium">Private Notes</p>
            <p className="text-xs text-moya-muted mt-0.5">Locked text notes</p>
          </Link>
          <Link
            href="/private/files"
            className="rounded-xl2 border border-moya-border border-dashed bg-moya-surface p-5 hover:shadow-card transition-shadow"
          >
            <div className="text-2xl mb-2">📎</div>
            <p className="text-moya-text font-medium">Private Files</p>
            <p className="text-xs text-moya-muted mt-0.5">Locked photos and documents</p>
          </Link>
        </div>
      </PrivateGate>
    </div>
  );
}
