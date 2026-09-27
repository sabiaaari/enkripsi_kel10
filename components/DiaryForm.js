'use client';

import { useState, useRef } from 'react';

export default function DiaryForm({
  folders,
  notes,
  selectedFolder,
  filterType,
  setFilterType,
  onSaveNote,
  onUnlockNote,
  onDeleteNote,
  onShareNote,
}) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(folders[0]?.id || '');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockPasswords, setUnlockPasswords] = useState({});

  const editorRef = useRef(null);

  const formatDoc = (cmd) => {
    document.execCommand(cmd, false, null);
    if (editorRef.current) editorRef.current.focus();
  };

  const insertImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgHtml = `<img src="${event.target.result}" alt="Foto Note" />`;
      document.execCommand('insertHTML', false, imgHtml);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const contentHtml = editorRef.current?.innerHTML || '';

    if (!title) return alert('Judul catatan wajib diisi!');
    if (!contentHtml.trim()) return alert('Isi catatan tidak boleh kosong!');
    if (usePassword && !password) return alert('Masukkan sandi rahasia!');

    onSaveNote({
      title,
      folderId,
      content: contentHtml,
      usePassword,
      password,
    });

    setTitle('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setUsePassword(false);
    setPassword('');
  };

  const filteredNotes = notes.filter((n) => {
    const matchesFolder = selectedFolder === 'all' || n.folderId === selectedFolder;
    const matchesFilter = filterType === 'all' || (filterType === 'locked' && n.isProtected);
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Form Tulis Catatan Baru */}
      <section className="bg-[#F8F5EE] border border-[#EFEAE0] p-4 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-3">
          <h2 className="font-semibold text-sm sm:text-base text-[#1C1E1B]">
            ✏️ Tulis Catatan Baru
          </h2>
          <span className="text-[10px] sm:text-[11px] font-medium bg-[#EFEAE0] text-[#4A4E49] px-2.5 py-0.5 rounded-full">
            Terenkripsi
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Judul catatan..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2A5C43]/20"
              required
            />
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs sm:text-sm focus:outline-none text-[#1C1E1B]"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rich Text Toolbar - Scrollable di HP */}
          <div className="bg-white border border-[#EFEAE0] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#2A5C43]/20">
            <div className="flex items-center gap-1 p-2 border-b border-[#EFEAE0] bg-[#FDFBF7] overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => formatDoc('bold')}
                className="px-2.5 py-1 hover:bg-[#EFEAE0] rounded text-xs font-bold shrink-0"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => formatDoc('italic')}
                className="px-2.5 py-1 hover:bg-[#EFEAE0] rounded text-xs italic shrink-0"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => formatDoc('underline')}
                className="px-2.5 py-1 hover:bg-[#EFEAE0] rounded text-xs underline shrink-0"
              >
                U
              </button>
              <div className="h-4 w-px bg-[#EFEAE0] mx-1 shrink-0"></div>
              <button
                type="button"
                onClick={() => formatDoc('insertUnorderedList')}
                className="px-2.5 py-1 hover:bg-[#EFEAE0] rounded text-xs shrink-0"
              >
                • List
              </button>
              <div className="h-4 w-px bg-[#EFEAE0] mx-1 shrink-0"></div>
              <label className="px-2.5 py-1 hover:bg-[#EFEAE0] rounded text-xs text-[#2A5C43] font-medium cursor-pointer shrink-0">
                🖼️ Tambah Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={insertImage}
                  className="hidden"
                />
              </label>
            </div>

            <div
              ref={editorRef}
              contentEditable
              placeholder="Tulis pikiran atau cerita hari ini..."
              className="min-h-[140px] sm:min-h-[180px] max-h-[350px] overflow-y-auto p-3.5 sm:p-4 text-xs sm:text-sm focus:outline-none editor-content leading-relaxed"
            ></div>
          </div>

          <div className="pt-2 border-t border-[#EFEAE0] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1C1E1B]">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="w-4 h-4 rounded border-[#EFEAE0] text-[#2A5C43]"
              />
              <span>Kunci catatan ini dengan Sandi Rahasia</span>
            </label>

            {usePassword && (
              <div className="pl-6">
                <input
                  type="password"
                  placeholder="Sandi khusus catatan ini..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 sm:py-3 bg-[#5c412a] hover:bg-[#493221] text-white font-medium rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            Simpan Catatan
          </button>
        </form>
      </section>

      {/* Search & Filter Responsif */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
          <input
            type="text"
            placeholder="🔍 Cari judul atau isi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-2/3 px-3.5 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none"
          />
          <div className="flex gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#5c412a] text-white'
                  : 'bg-[#EFEAE0] text-[#4A4E49]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('locked')}
              className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'locked'
                  ? 'bg-[#5c412a] text-white'
                  : 'bg-[#EFEAE0] text-[#4A4E49]'
              }`}
            >
              🔒 Tersandi
            </button>
          </div>
        </div>

        {/* List Catatan */}
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#EFEAE0] rounded-2xl bg-[#F8F5EE]/40">
              <p className="text-xs text-[#6E726D]">Tidak ada catatan ditemukan.</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const folder = folders.find((f) => f.id === note.folderId) || {
                name: 'Umum',
                color: '#2A5C43',
              };
              const isLocked = note.isProtected && !note.unlocked;

              return (
                <div
                  key={note.id}
                  className="bg-[#F8F5EE] border border-[#EFEAE0] p-4 rounded-2xl space-y-3 transition-all"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-[9px] sm:text-[10px] font-medium text-white px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: folder.color }}
                        >
                          {folder.name}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#6E726D]">
                          {note.date}
                        </span>
                      </div>
                      <h3 className="font-semibold text-xs sm:text-sm text-[#1C1E1B]">
                        {note.title}
                      </h3>
                    </div>
                    {note.isProtected && (
                      <span className="text-[9px] sm:text-[10px] font-medium bg-[#F7F2E7] text-[#8C6D2B] px-2 py-0.5 rounded-full border border-[#EFEAE0] shrink-0">
                        🔒 TERSANDI
                      </span>
                    )}
                  </div>

                  {isLocked ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[#EFEAE0]">
                      <input
                        type="password"
                        placeholder="Masukkan sandi..."
                        value={unlockPasswords[note.id] || ''}
                        onChange={(e) =>
                          setUnlockPasswords({
                            ...unlockPasswords,
                            [note.id]: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => onUnlockNote(note.id, unlockPasswords[note.id])}
                        className="px-4 py-1.5 bg-[#2A5C43] text-white text-xs font-medium rounded-xl hover:bg-[#214935] cursor-pointer"
                      >
                        Buka
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#EFEAE0] space-y-3">
                      <div
                        dangerouslySetInnerHTML={{ __html: note.content }}
                        className="text-xs text-[#1C1E1B] bg-white p-3 sm:p-3.5 rounded-xl border border-[#EFEAE0] editor-content leading-relaxed overflow-x-auto"
                      />
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => onShareNote(note)}
                          className="px-2.5 py-1 bg-white border border-[#EFEAE0] text-[#1C1E1B] text-xs font-medium rounded-xl hover:bg-[#EFEAE0] cursor-pointer"
                        >
                          📲 Bagikan
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="text-xs text-red-600 hover:underline font-medium cursor-pointer"
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
    </div>
  );
}