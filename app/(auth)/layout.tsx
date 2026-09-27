import Link from "next/link";
import YarnMark from "@/components/YarnMark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <YarnMark size={26} />
        <span className="font-display text-xl text-moya-text">MOYA</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
