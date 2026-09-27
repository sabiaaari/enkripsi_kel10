import PageHeader from "@/components/PageHeader";
import PrivateGate from "@/components/PrivateGate";

export default function PrivateFilesPage() {
  return (
    <div>
      <PageHeader title="Private Files" subtitle="Locked photos and documents" />
      <PrivateGate>
        <div className="rounded-xl2 border border-moya-border border-dashed bg-moya-surface p-8 text-center">
          <p className="text-sm text-moya-muted">
            No private files yet. Upload one and toggle{" "}
            <span className="text-moya-text">🔒 Make Private</span> to keep it here.
          </p>
        </div>
      </PrivateGate>
    </div>
  );
}
