'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthForm from '@/components/AuthForm';
import DiaryForm from '@/components/DiaryForm';
import CalendarTodo from '@/components/CalendarTodo';
import FolderModal from '@/components/FolderModal';

const INITIAL_FOLDERS = [
  { id: 'pribadi', name: 'Pribadi', color: '#2A5C43' },
  { id: 'kuliah', name: 'Kuliah', color: '#2563EB' },
  { id: 'pekerjaan', name: 'Pekerjaan', color: '#D97706' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('diary');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [todos, setTodos] = useState([]);

  // Load awal dari LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('vn_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedFolders = localStorage.getItem('vn_folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      setFolders(INITIAL_FOLDERS);
      localStorage.setItem('vn_folders', JSON.stringify(INITIAL_FOLDERS));
    }

    const savedNotes = localStorage.getItem('vn_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedTodos = localStorage.getItem('vn_todos');
    if (savedTodos) setTodos(JSON.parse(savedTodos));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('vn_user', JSON.stringify(userData));
  };

  const handleGoogleAuth = () => {
    const gUser = { name: 'Ila (Google)', email: 'ila.google@example.com' };
    setUser(gUser);
    localStorage.setItem('vn_user', JSON.stringify(gUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vn_user');
  };

  const handleCreateFolder = (newFolderData) => {
    const folder = { id: 'f_' + Date.now(), ...newFolderData };
    const updated = [...folders, folder];
    setFolders(updated);
    localStorage.setItem('vn_folders', JSON.stringify(updated));
  };

  const handleSaveNote = (newNoteData) => {
    const note = {
      id: 'n_' + Date.now(),
      title: newNoteData.title,
      folderId: newNoteData.folderId,
      content: newNoteData.content,
      isProtected: newNoteData.usePassword,
      password: newNoteData.password || null,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    localStorage.setItem('vn_notes', JSON.stringify(updated));
  };

  const handleUnlockNote = (id, inputPassword) => {
    const updated = notes.map((n) => {
      if (n.id === id && n.password === inputPassword) {
        return { ...n, unlocked: true };
      }
      return n;
    });
    setNotes(updated);
  };

  const handleDeleteNote = (id) => {
    if (confirm('Yakin ingin menghapus catatan ini?')) {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);
      localStorage.setItem('vn_notes', JSON.stringify(updated));
    }
  };

  const handleShareNote = (note) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = note.content;
    const plainText = tmp.textContent || tmp.innerText || '';

    if (navigator.share) {
      navigator.share({ title: note.title, text: `${note.title}\n\n${plainText}` });
    } else {
      navigator.clipboard.writeText(`${note.title}\n\n${plainText}`);
      alert('Teks catatan berhasil disalin ke clipboard!');
    }
  };

  const handleAddTodo = (newTodoData) => {
    const todo = {
      id: 't_' + Date.now(),
      ...newTodoData,
      completed: false,
    };
    const updated = [...todos, todo];
    setTodos(updated);
    localStorage.setItem('vn_todos', JSON.stringify(updated));
  };

  const handleToggleTodo = (id) => {
    const updated = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(updated);
    localStorage.setItem('vn_todos', JSON.stringify(updated));
  };

  const handleDeleteTodo = (id) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    localStorage.setItem('vn_todos', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {!user ? (
          <AuthForm onLogin={handleLogin} onGoogleAuth={handleGoogleAuth} />
        ) : (
          <div className="space-y-6">
            {/* Navigasi Tab Utama & Bar Filter Folder */}
            <div className="space-y-3">
              <div className="flex bg-[#F8F5EE] border border-[#EFEAE0] p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('diary')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === 'diary'
                      ? 'bg-white text-[#1C1E1B] shadow-xs'
                      : 'text-[#6E726D] hover:text-[#1C1E1B]'
                  }`}
                >
                  📝 Catatan Harian
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer ${
                    activeTab === 'calendar'
                      ? 'bg-white text-[#1C1E1B] shadow-xs'
                      : 'text-[#6E726D] hover:text-[#1C1E1B]'
                  }`}
                >
                  📅 Kalender & To-Do List
                </button>
              </div>

              {/* Bar Filter Folder Chips */}
              <div className="flex items-center justify-between gap-2 bg-[#F8F5EE] p-2.5 rounded-2xl border border-[#EFEAE0] overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-1.5 text-xs text-[#6E726D] font-medium pl-1 pr-2 border-r border-[#EFEAE0] shrink-0">
                  📁 Folder:
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedFolder('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      selectedFolder === 'all'
                        ? 'bg-[#1C1E1B] text-white'
                        : 'bg-white text-[#4A4E49] border border-[#EFEAE0]'
                    }`}
                  >
                    Semua
                  </button>
                  {folders.map((f) => {
                    const isSel = selectedFolder === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFolder(f.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? 'text-white'
                            : 'bg-white text-[#4A4E49] border border-[#EFEAE0]'
                        }`}
                        style={{ backgroundColor: isSel ? f.color : undefined }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: f.color }}
                        />
                        {f.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setIsFolderModalOpen(true)}
                  className="text-xs text-[#5c3e2a] hover:bg-white px-2.5 py-1 rounded-xl font-semibold border border-dashed border-[#2A5C43]/40 transition-colors shrink-0 cursor-pointer"
                >
                  + Folder Baru
                </button>
              </div>
            </div>

            {/* Render Konten Berdasarkan Tab */}
            {activeTab === 'diary' ? (
              <DiaryForm
                folders={folders}
                notes={notes}
                selectedFolder={selectedFolder}
                filterType={filterType}
                setFilterType={setFilterType}
                onSaveNote={handleSaveNote}
                onUnlockNote={handleUnlockNote}
                onDeleteNote={handleDeleteNote}
                onShareNote={handleShareNote}
              />
            ) : (
              <CalendarTodo
                folders={folders}
                todos={todos}
                selectedFolder={selectedFolder}
                onAddTodo={handleAddTodo}
                onToggleTodo={handleToggleTodo}
                onDeleteTodo={handleDeleteTodo}
              />
            )}
          </div>
        )}
      </main>

      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
}