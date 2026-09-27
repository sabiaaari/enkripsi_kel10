import PageHeader from "@/components/PageHeader";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" subtitle="Name and profile photo" />
      <div className="rounded-xl2 border border-moya-border bg-moya-surface p-6 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-moya-primary/30 flex items-center justify-center text-2xl">
            🧶
          </div>
          <button className="text-sm text-moya-primarydark hover:underline">
            Change photo
          </button>
        </div>
        <label className="block text-sm text-moya-text mb-1.5">Display name</label>
        <input
          defaultValue="Yarn Keeper"
          className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text mb-4 focus-ring"
        />
        <label className="block text-sm text-moya-text mb-1.5">Short bio</label>
        <textarea
          defaultValue="Collecting notes like skeins of yarn."
          rows={3}
          className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text mb-5 focus-ring"
        />
        <button className="rounded-xl bg-moya-primary hover:bg-moya-primarydark text-white text-sm font-medium px-5 py-2.5 transition-colors focus-ring">
          Save changes
        </button>
      </div>
    </div>
  );
}
