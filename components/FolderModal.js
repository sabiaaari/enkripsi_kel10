'use client';

import { useState } from 'react';

const FOLDER_COLORS = ['#2A5C43', '#8C6D2B', '#2563EB', '#D97706', '#DC2626', '#7C3AED'];

export default function FolderModal({ isOpen, onClose, onCreateFolder }) {
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onCreateFolder({ name: folderName, color: selectedColor });
    setFolderName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border border-[#EFEAE0] max-w-xs w-full p-5 rounded-2xl space-y-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-[#1C1E1B]">Buat Folder Baru</h3>
          <button onClick={onClose} className="text-[#6E726D] hover:text-[#1C1E1B] text-xs font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#4A4E49] mb-1">Nama Folder</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              required
              placeholder="Contoh: Kuliah, Pribadi"
              className="w-full px-3 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A4E49] mb-1">Warna Label</label>
            <div className="flex gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all cursor-pointer"
                  style={{
                    backgroundColor: c,
                    borderColor: selectedColor === c ? '#1C1E1B' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#2A5C43] text-white text-xs font-medium rounded-xl hover:bg-[#214935] transition-colors cursor-pointer"
          >
            Simpan Folder
          </button>
        </form>
      </div>
    </div>
  );
}