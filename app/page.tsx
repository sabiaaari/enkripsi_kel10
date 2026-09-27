import Link from "next/link";
import YarnMark from "@/components/YarnMark";

const features = [
  {
    icon: "📝",
    title: "Notes",
    desc: "Tulis apa saja — catatan kuliah, ide mendadak, atau isi kepala yang perlu ditaruh di suatu tempat. Bisa dipin, bisa dikategorikan.",
    color: "bg-moya-primary/20",
  },
  {
    icon: "📎",
    title: "Files",
    desc: "Simpan foto, dokumen, sampai foto catatan tulisan tangan dari kelas — semua rapi dalam satu tempat, gampang dicari lagi.",
    color: "bg-moya-sage/40",
  },
  {
    icon: "🔒",
    title: "Private",
    desc: "Ada ruang khusus yang dikunci PIN, untuk hal-hal yang ingin kamu simpan lebih personal, jauh dari catatan sehari-hari.",
    color: "bg-moya-pink/40",
  },
  {
    icon: "🎨",
    title: "Simple & Calm",
    desc: "Tanpa menu yang penuh sesak. Semua tersusun rapi, supaya buka MOYA terasa seperti menarik napas, bukan menambah beban.",
    color: "bg-moya-butter/40",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* top nav */}
      <header className="px-6 md:px-10 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <YarnMark size={26} />
          <span className="font-display text-xl text-moya-text">MOYA</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/masuk"
            className="text-sm text-moya-text px-4 py-2 rounded-xl hover:bg-moya-soft transition-colors focus-ring"
          >
            Masuk
          </Link>
          <Link
            href="/daftar"
            className="text-sm text-white bg-moya-primary hover:bg-moya-primarydark px-4 py-2 rounded-xl transition-colors focus-ring"
          >
            Daftar
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="px-6 md:px-10 pt-10 md:pt-16 pb-16 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm text-moya-primarydark font-medium mb-3">
            Selamat datang di MOYA
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight text-moya-text mb-5">
            Satu ruang tenang untuk semua catatanmu.
          </h1>
          <p className="text-moya-muted text-[15px] leading-relaxed mb-8 max-w-md">
            MOYA — <span className="italic">Make Own Yarns</span> — adalah tempat
            menyimpan catatan, foto, dan dokumen tanpa harus berpindah-pindah
            aplikasi. Dibuat sederhana dan tenang, supaya yang penting saja yang
            terlihat.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/daftar"
              className="text-sm text-white bg-moya-primary hover:bg-moya-primarydark px-6 py-3 rounded-xl shadow-card transition-colors focus-ring"
            >
              ＋ Daftar, gratis
            </Link>
            <Link
              href="/masuk"
              className="text-sm text-moya-text border border-moya-border bg-moya-surface hover:bg-moya-soft px-6 py-3 rounded-xl transition-colors focus-ring"
            >
              Sudah punya akun? Masuk
            </Link>
          </div>
        </div>

        {/* stacked note preview */}
        <div className="relative h-72 md:h-80 hidden sm:block">
          <div className="absolute top-6 right-4 w-64 rotate-3 rounded-xl2 border border-moya-border bg-moya-surface shadow-soft p-4">
            <p className="text-xs px-2 py-0.5 rounded-full bg-moya-sage/40 text-[#3f6b45] inline-block mb-2">
              Ideas
            </p>
            <p className="font-display text-moya-text mb-1">App idea: sleep mixer</p>
            <p className="text-xs text-moya-muted">Layer rain, keyboard clicks, low hum…</p>
          </div>
          <div className="absolute top-24 left-2 w-64 -rotate-2 rounded-xl2 border border-moya-border bg-moya-surface shadow-soft p-4">
            <p className="text-xs px-2 py-0.5 rounded-full bg-moya-primary/20 text-moya-primarydark inline-block mb-2">
              College
            </p>
            <p className="font-display text-moya-text mb-1">Thermodynamics — Ch. 4</p>
            <p className="text-xs text-moya-muted">Entropy always increases…</p>
          </div>
          <div className="absolute top-44 right-8 w-56 rotate-1 rounded-xl2 border border-moya-border border-dashed bg-moya-surface shadow-soft p-4">
            <p className="text-xs px-2 py-0.5 rounded-full bg-moya-pink/40 text-[#8a4f5f] inline-block mb-2">
              🔒 Private
            </p>
            <p className="font-display text-moya-text mb-1">Journal — small win</p>
            <p className="text-xs text-moya-muted">Finished the first sleeve today…</p>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="px-6 md:px-10 py-14 bg-moya-surface border-y border-moya-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl text-moya-text mb-2">
            Semua yang kamu butuh, tidak lebih
          </h2>
          <p className="text-moya-muted text-[15px] mb-10 max-w-md">
            Empat ruang sederhana yang menampung hampir semua hal — tanpa fitur
            yang bikin bingung.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl2 border border-moya-border p-5 bg-moya-bg"
              >
                <div className={`w-10 h-10 rounded-lg ${f.color} flex items-center justify-center text-lg mb-3`}>
                  {f.icon}
                </div>
                <p className="font-display text-lg text-moya-text mb-1.5">{f.title}</p>
                <p className="text-sm text-moya-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* closing CTA */}
      <section className="px-6 md:px-10 py-16 text-center">
        <h2 className="font-display text-2xl md:text-3xl text-moya-text mb-3">
          Mulai simpan yang pertama, hari ini.
        </h2>
        <p className="text-moya-muted text-[15px] mb-7">
          Gratis untuk mulai, dan tetap tenang selamanya.
        </p>
        <Link
          href="/daftar"
          className="inline-block text-sm text-white bg-moya-primary hover:bg-moya-primarydark px-7 py-3 rounded-xl shadow-card transition-colors focus-ring"
        >
          ＋ Buat akun MOYA
        </Link>
      </section>

      <footer className="px-6 md:px-10 py-6 text-center text-xs text-moya-muted border-t border-moya-border">
        MOYA — Make Own Yarns
      </footer>
    </div>
  );
}
