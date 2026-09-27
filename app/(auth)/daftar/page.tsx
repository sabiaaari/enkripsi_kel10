import Link from "next/link";

export default function DaftarPage() {
  return (
    <div className="rounded-xl2 border border-moya-border bg-moya-surface p-7 shadow-soft">
      <h1 className="font-display text-2xl text-moya-text mb-1.5">Buat akun MOYA</h1>
      <p className="text-sm text-moya-muted mb-6">
        Gratis untuk mulai — ruang tenangmu siap dalam semenit.
      </p>

      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-moya-text mb-1.5">Nama</label>
          <input
            type="text"
            placeholder="Nama kamu"
            className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text focus-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-moya-text mb-1.5">Email</label>
          <input
            type="email"
            placeholder="kamu@email.com"
            className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text focus-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-moya-text mb-1.5">Kata sandi</label>
          <input
            type="password"
            placeholder="Minimal 8 karakter"
            className="w-full rounded-xl border border-moya-border bg-moya-bg px-3.5 py-2.5 text-sm text-moya-text focus-ring"
          />
        </div>
        <Link
          href="/dashboard"
          className="text-center rounded-xl bg-moya-primary hover:bg-moya-primarydark text-white text-sm font-medium py-2.5 mt-1 transition-colors focus-ring"
        >
          Daftar
        </Link>
      </form>

      <p className="text-center text-sm text-moya-muted mt-6">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="text-moya-primarydark hover:underline">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
