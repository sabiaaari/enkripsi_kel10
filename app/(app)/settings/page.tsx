import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const items = [
  { href: "/settings/profile", icon: "👤", label: "Profile", desc: "Name and profile photo" },
  { href: "/settings/appearance", icon: "🎨", label: "Appearance", desc: "Light or dark mode" },
  { href: "/settings/account", icon: "🔑", label: "Account", desc: "Password and logout" },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Make MOYA feel like yours" />
      <div className="flex flex-col gap-2.5">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-3.5 rounded-xl2 border border-moya-border bg-moya-surface p-4 hover:shadow-card transition-shadow"
          >
            <span className="w-10 h-10 rounded-lg bg-moya-soft flex items-center justify-center text-lg">
              {it.icon}
            </span>
            <div>
              <p className="text-moya-text font-medium">{it.label}</p>
              <p className="text-xs text-moya-muted">{it.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
