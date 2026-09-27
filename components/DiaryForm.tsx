"use client";

import { useState, useEffect } from "react";
import { encryptDiary, decryptDiary } from "@/utils/crypto";

export type Folder = {
  id: string;
  name: string;
  color: string;
};

export type Note = {
  id: string;
  title: string;
  folderId?: string;
  content: string; // Base64 ciphertext bila terenkripsi, atau plainteks
  salt?: string; // Salt Base64
  iv?: string; // IV Base64
  isProtected: boolean;
  unlocked?: boolean;
  decryptedContent?: string;
  date: string;
};

const DEFAULT_FOLDERS: Folder[] = [
  { id: "pribadi", name: "Pribadi", color: "#A996D6" },
  { id: "kuliah", name: "Kuliah", color: "#8874C2" },
  { id: "pekerjaan", name: "Pekerjaan", color: "#BFD8BD" },
];

interface DiaryFormProps {
  folders?: Folder[];
}

export default function DiaryForm({
  folders = DEFAULT_FOLDERS,
}: DiaryFormProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState(folders[0]?.id || "pribadi");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "locked">("all");
  const [unlockPasswords, setUnlockPasswords] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCryptoModal, setActiveCryptoModal] = useState<Note | null>(null);

  // Load awal dari LocalStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("vn_notes");
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Gagal membaca catatan dari localStorage", e);
      }
    }
  }, []);

  // Simpan catatan baru dengan integrasi enkripsi AES-256-GCM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Judul catatan wajib diisi!");
      return;
    }
    if (!content.trim()) {
      alert("Isi catatan tidak boleh kosong!");
      return;
    }
    if (usePassword && !password) {
      alert("Masukkan sandi rahasia untuk enkripsi catatan!");
      return;
    }

    setIsProcessing(true);

    try {
      let finalContent = content;
      let salt: string | undefined = undefined;
      let iv: string | undefined = undefined;

      if (usePassword) {
        // Enkripsi isi catatan dengan modul crypto (AES-256-GCM + PBKDF2)
        const encrypted = await encryptDiary(content, password);
        finalContent = encrypted.content; // Ciphertext Base64
        salt = encrypted.salt;
        iv = encrypted.iv;
      }

      const newNote: Note = {
        id: "n_" + Date.now(),
        title,
        folderId,
        content: finalContent,
        salt,
        iv,
        isProtected: usePassword,
        unlocked: !usePassword,
        decryptedContent: usePassword ? undefined : content,
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updated = [newNote, ...notes];
      setNotes(updated);
      localStorage.setItem("vn_notes", JSON.stringify(updated));

      // Reset form
      setTitle("");
      setContent("");
      setUsePassword(false);
      setPassword("");
      alert(
        usePassword
          ? "Catatan berhasil dienkripsi dengan AES-256-GCM dan disimpan!"
          : "Catatan berhasil disimpan!"
      );
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengenkripsi catatan: " + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Dekripsi catatan menggunakan password
  const handleUnlockNote = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const inputPwd = unlockPasswords[noteId];
    if (!inputPwd) {
      alert("Masukkan sandi untuk membuka catatan ini!");
      return;
    }

    try {
      if (!note.salt || !note.iv) {
        throw new Error("Parameter kriptografi (salt / iv) tidak lengkap pada catatan ini.");
      }

      // Proses dekripsi (AES-256-GCM + PBKDF2)
      const decryptedText = await decryptDiary(note.content, note.salt, note.iv, inputPwd);

      const updated = notes.map((n) => {
        if (n.id === noteId) {
          return {
            ...n,
            decryptedContent: decryptedText,
            unlocked: true,
          };
        }
        return n;
      });

      setNotes(updated);
      setUnlockPasswords((prev) => ({ ...prev, [noteId]: "" }));
    } catch (err: any) {
      alert("❌ " + (err?.message || "Kata sandi salah atau cipherteks telah diubah!"));
    }
  };

  // Kunci kembali catatan
  const handleLockAgain = (noteId: string) => {
    const updated = notes.map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          decryptedContent: undefined,
          unlocked: false,
        };
      }
      return n;
    });
    setNotes(updated);
  };

  // Hapus catatan
  const handleDeleteNote = (noteId: string) => {
    if (confirm("Yakin ingin menghapus catatan ini?")) {
      const updated = notes.filter((n) => n.id !== noteId);
      setNotes(updated);
      localStorage.setItem("vn_notes", JSON.stringify(updated));
    }
  };

  // Uji Tamper: Merusak 1 karakter cipherteks untuk demo UTS penolakan integritas
  const handleTamperCiphertext = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !note.isProtected) return;

    if (
      !confirm(
        "Apakah Anda ingin memodifikasi 1 karakter cipherteks untuk menguji integritas autentikasi GCM (tamper check)?"
      )
    ) {
      return;
    }

    // Ubah karakter pertama dari Base64 ciphertext
    const originalCipher = note.content;
    const modifiedCipher =
      (originalCipher[0] === "A" ? "B" : "A") + originalCipher.slice(1);

    const updated = notes.map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          content: modifiedCipher,
          unlocked: false,
          decryptedContent: undefined,
        };
      }
      return n;
    });

    setNotes(updated);
    localStorage.setItem("vn_notes", JSON.stringify(updated));
    alert(
      "Cipherteks telah dimanipulasi (1 karakter diubah). Sekarang coba lakukan dekripsi dengan kata sandi yang benar untuk menguji penolakan integritas!"
    );
  };

  // Salin cipherteks Base64
  const handleCopyCiphertext = (cipherText: string) => {
    navigator.clipboard.writeText(cipherText);
    alert("Cipherteks Base64 berhasil disalin ke clipboard!");
  };

  // Filter & Pencarian
  const filteredNotes = notes.filter((n) => {
    const matchesFilter = filterType === "all" || (filterType === "locked" && n.isProtected);
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.unlocked && n.decryptedContent
        ? n.decryptedContent.toLowerCase().includes(searchQuery.toLowerCase())
        : false);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Form Tulis Catatan Baru */}
      <section className="bg-moya-surface border border-moya-border p-5 sm:p-7 rounded-xl2 shadow-soft space-y-5">
        <div className="flex items-center justify-between border-b border-moya-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✏️</span>
            <div>
              <h2 className="font-display text-lg text-moya-text">Tulis Catatan Baru</h2>
              <p className="text-xs text-moya-muted">
                Catatan tersimpan lokal dengan perlindungan kriptografi modern
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium bg-moya-soft text-moya-primarydark px-3 py-1 rounded-full border border-moya-border flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-moya-primary animate-pulse" />
            AES-256-GCM
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Judul catatan..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring"
              required
            />
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="px-3.5 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <textarea
              rows={4}
              placeholder="Tulis pikiran, cerita, atau rahasia hari ini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring leading-relaxed"
              required
            />
          </div>

          <div className="pt-2 border-t border-moya-border space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-moya-text select-none">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="w-4 h-4 rounded border-moya-border text-moya-primarydark focus-ring"
              />
              <span className="flex items-center gap-1.5">
                🔒 Kunci catatan ini dengan Sandi Rahasia (AES-256-GCM + PBKDF2)
              </span>
            </label>

            {usePassword && (
              <div className="pl-6 animate-in space-y-1.5">
                <input
                  type="password"
                  placeholder="Masukkan sandi rahasia untuk catatan ini..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
                />
                <p className="text-[11px] text-moya-muted">
                  Kunci enkripsi akan diturunkan dari sandi menggunakan PBKDF2 (600.000 iterasi) dengan salt unik acak 128-bit.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-moya-primary hover:bg-moya-primarydark text-white font-medium rounded-xl text-sm transition-colors shadow-card focus-ring disabled:opacity-50"
          >
            {isProcessing ? "Sedang Mengenkripsi..." : "Simpan Catatan"}
          </button>
        </form>
      </section>

      {/* Search & Filter Responsif */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-moya-muted text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari judul catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-moya-surface border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors focus-ring ${
                filterType === "all"
                  ? "bg-moya-primary text-white"
                  : "bg-moya-surface border border-moya-border text-moya-text hover:bg-moya-bg"
              }`}
            >
              Semua ({notes.length})
            </button>
            <button
              onClick={() => setFilterType("locked")}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors focus-ring ${
                filterType === "locked"
                  ? "bg-moya-primary text-white"
                  : "bg-moya-surface border border-moya-border text-moya-text hover:bg-moya-bg"
              }`}
            >
              🔒 Tersandi ({notes.filter((n) => n.isProtected).length})
            </button>
          </div>
        </div>

        {/* List Catatan */}
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-moya-border rounded-xl2 bg-moya-surface/60">
              <p className="text-sm text-moya-muted">Belum ada catatan ditemukan.</p>
              <p className="text-xs text-moya-muted mt-1">
                Tulis catatan baru di atas untuk mencoba enkripsi dan dekripsi.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const folder = folders.find((f) => f.id === note.folderId) || {
                name: "Umum",
                color: "#A996D6",
              };
              const isLocked = note.isProtected && !note.unlocked;

              return (
                <div
                  key={note.id}
                  className="bg-moya-surface border border-moya-border p-5 rounded-xl2 shadow-card space-y-3.5 transition-all"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="text-[10px] font-medium text-white px-2.5 py-0.5 rounded-md"
                          style={{ backgroundColor: folder.color }}
                        >
                          {folder.name}
                        </span>
                        <span className="text-[11px] text-moya-muted">
                          {note.date}
                        </span>
                      </div>
                      <h3 className="font-display font-medium text-base text-moya-text">
                        {note.title}
                      </h3>
                    </div>
                    {note.isProtected && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-semibold bg-moya-soft text-moya-primarydark px-2.5 py-1 rounded-full border border-moya-border">
                          {isLocked ? "🔒 TERENKRIPSI" : "🔓 TERBUKA"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveCryptoModal(note)}
                          className="text-[11px] text-moya-muted hover:text-moya-primarydark px-1.5 py-0.5 rounded hover:bg-moya-soft transition-colors"
                          title="Lihat Bundle Kriptografi"
                        >
                          ℹ️ Info
                        </button>
                      </div>
                    )}
                  </div>

                  {isLocked ? (
                    <div className="pt-2 border-t border-moya-border space-y-3">
                      <div className="bg-moya-bg p-3 rounded-xl border border-moya-border text-xs text-moya-muted space-y-1">
                        <p className="font-medium text-moya-text flex items-center gap-1.5">
                          <span>🔐</span> Konten Catatan Dienkripsi (AES-GCM 256-bit)
                        </p>
                        <p className="font-mono text-[11px] break-all truncate">
                          Ciphertext: {note.content.slice(0, 48)}...
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="password"
                          placeholder="Masukkan sandi untuk membuka..."
                          value={unlockPasswords[note.id] || ""}
                          onChange={(e) =>
                            setUnlockPasswords({
                              ...unlockPasswords,
                              [note.id]: e.target.value,
                            })
                          }
                          className="flex-1 px-3.5 py-2 bg-moya-bg border border-moya-border rounded-xl text-xs text-moya-text focus-ring"
                        />
                        <button
                          onClick={() => handleUnlockNote(note.id)}
                          className="px-4 py-2 bg-moya-primary text-white text-xs font-medium rounded-xl hover:bg-moya-primarydark transition-colors focus-ring"
                        >
                          Buka Catatan
                        </button>
                      </div>

                      {/* Tombol demonstrasi pengujian UTS */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={() => handleCopyCiphertext(note.content)}
                          className="text-[11px] text-moya-muted hover:text-moya-text px-2 py-1 rounded bg-moya-bg border border-moya-border hover:bg-moya-soft transition-colors"
                        >
                          📋 Salin Base64 Ciphertext
                        </button>
                        <button
                          onClick={() => handleTamperCiphertext(note.id)}
                          className="text-[11px] text-amber-700 hover:text-amber-800 px-2 py-1 rounded bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                          title="Ubah 1 karakter cipherteks untuk menguji kegagalan verifikasi tag"
                        >
                          ⚠️ Uji Tamper (Modifikasi 1 Byte)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-moya-border space-y-3">
                      <div className="text-sm text-moya-text bg-moya-bg p-3.5 rounded-xl border border-moya-border leading-relaxed whitespace-pre-wrap">
                        {note.decryptedContent || note.content}
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <div className="flex items-center gap-2">
                          {note.isProtected && (
                            <button
                              onClick={() => handleLockAgain(note.id)}
                              className="px-3 py-1.5 bg-moya-bg border border-moya-border text-moya-text text-xs font-medium rounded-xl hover:bg-moya-soft transition-colors focus-ring"
                            >
                              🔒 Kunci Kembali
                            </button>
                          )}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${note.title}\n\n${note.decryptedContent || note.content}`
                              );
                              alert("Isi catatan berhasil disalin ke clipboard!");
                            }}
                            className="px-3 py-1.5 bg-moya-bg border border-moya-border text-moya-text text-xs font-medium rounded-xl hover:bg-moya-soft transition-colors focus-ring"
                          >
                            📲 Bagikan
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal Detail Kriptografi (Memenuhi spesifikasi UTS: info Base64, Salt, IV, dan Tag) */}
      {activeCryptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in">
          <div className="bg-moya-surface border border-moya-border rounded-xl2 shadow-soft max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-moya-border pb-3">
              <h3 className="font-display font-medium text-base text-moya-text flex items-center gap-2">
                <span>🔐</span> Detail Paket Kriptografi
              </h3>
              <button
                onClick={() => setActiveCryptoModal(null)}
                className="text-moya-muted hover:text-moya-text text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="font-medium text-moya-text mb-1">Judul Catatan:</p>
                <p className="text-moya-muted">{activeCryptoModal.title}</p>
              </div>

              <div>
                <p className="font-medium text-moya-text mb-1">Algoritma & Mode:</p>
                <p className="font-mono bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-primarydark">
                  AES-256-GCM (Key Derivation: PBKDF2 with SHA-256, 600,000 iterations)
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium text-moya-text">Ciphertext (Base64):</p>
                  <button
                    onClick={() => handleCopyCiphertext(activeCryptoModal.content)}
                    className="text-[11px] text-moya-primarydark hover:underline"
                  >
                    Salin
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={3}
                  value={activeCryptoModal.content}
                  className="w-full font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium text-moya-text mb-1">Salt (Base64, 16B):</p>
                  <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted break-all">
                    {activeCryptoModal.salt || "-"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-moya-text mb-1">IV / Nonce (Base64, 12B):</p>
                  <p className="font-mono text-[11px] bg-moya-bg p-2 rounded-lg border border-moya-border text-moya-muted break-all">
                    {activeCryptoModal.iv || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-moya-border flex justify-end">
              <button
                onClick={() => setActiveCryptoModal(null)}
                className="px-4 py-2 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl text-xs font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
