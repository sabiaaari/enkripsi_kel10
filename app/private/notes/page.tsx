import PageHeader from "@/components/PageHeader";
import PrivateGate from "@/components/PrivateGate";

export default function PrivateNotesPage() {
  return (
    <div>
      <PageHeader title="Private Notes" subtitle="Only visible after you unlock this space" />
      <PrivateGate>
        <div className="rounded-xl2 border border-moya-border border-dashed bg-moya-surface p-5">
          <h3 className="font-display text-lg text-moya-text mb-1.5">
            Things I haven't said out loud
          </h3>
          <p className="text-sm text-moya-muted leading-relaxed">
            A quiet note only you can read. Write freely here — nothing in this
            space leaves without your PIN.
          </p>
        </div>
      </PrivateGate>
    </div>
  );
}
