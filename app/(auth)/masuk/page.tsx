import Link from "next/link";

export default function MasukPage() {
  return (
    <div className="rounded-xl2 border border-moya-border bg-moya-surface p-7 shadow-soft">
      <h1 className="font-display text-2xl text-moya-text mb-1.5">Selamat datang kembali</h1>
      <p className="text-sm text-moya-muted mb-6">Masuk untuk lanjut menyimpan catatanmu.</p>

      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-moya-text mb-1.5">Email</label>
          <input
            type="email"
            placeholder="kamu@email.com"
            className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text focus-ring"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm text-moya-text">Kata sandi</label>
            <span className="text-xs text-moya-primarydark hover:underline cursor-pointer">
              Lupa sandi?
            </span>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text focus-ring"
          />
        </div>
        <Link
          href="/dashboard"
          className="text-center rounded-xl bg-moya-primary hover:bg-moya-primarydark text-white text-sm font-medium py-2.5 mt-1 transition-colors focus-ring"
        >
          Masuk
        </Link>
      </form>

      <p className="text-center text-sm text-moya-muted mt-6">
        Belum punya akun?{" "}
        <Link href="/daftar" className="text-moya-primarydark hover:underline">
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}
