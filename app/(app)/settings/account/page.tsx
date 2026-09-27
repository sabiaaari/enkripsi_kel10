import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function AccountPage() {
  return (
    <div>
      <PageHeader title="Account" subtitle="Password and logout" />
      <div className="rounded-xl2 border border-moya-border bg-moya-surface p-6 max-w-md mb-4">
        <label className="block text-sm text-moya-text mb-1.5">Email</label>
        <input
          defaultValue="you@example.com"
          disabled
          className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-muted mb-4"
        />
        <label className="block text-sm text-moya-text mb-1.5">New password</label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text mb-5 focus-ring"
        />
        <button className="rounded-xl bg-moya-primary hover:bg-moya-primarydark text-white text-sm font-medium px-5 py-2.5 transition-colors focus-ring">
          Update password
        </button>
      </div>
      <Link
        href="/"
        className="inline-block rounded-xl border border-moya-border bg-moya-surface text-sm text-[#c06b7e] font-medium px-5 py-2.5 hover:bg-moya-pink/20 transition-colors focus-ring"
      >
        Log out
      </Link>
    </div>
  );
}
