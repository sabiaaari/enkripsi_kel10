'use client';

import { useState } from 'react';

export default function CalendarTodo({
  folders,
  todos,
  selectedFolder,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) {
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 8, 1));
  const [selectedDate, setSelectedDate] = useState('2026-09-26');
  const [todoText, setTodoText] = useState('');
  const [folderId, setFolderId] = useState(folders[0]?.id || '');

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handleAdd = (e) => {
    e.preventDefault();
    if (!todoText.trim()) return;

    onAddTodo({
      text: todoText,
      folderId,
      date: selectedDate,
    });

    setTodoText('');
  };

  const filteredTodos = todos.filter(
    (t) =>
      t.date === selectedDate &&
      (selectedFolder === 'all' || t.folderId === selectedFolder)
  );

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
      {/* Calendar Grid - Otomatis Menyesuaikan di Layar HP */}
      <div className="md:col-span-7 bg-[#F8F5EE] border border-[#EFEAE0] p-3.5 sm:p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs sm:text-sm text-[#1C1E1B]">
            {monthNames[month]} {year}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
              className="p-1 sm:p-1.5 hover:bg-[#EFEAE0] rounded-lg cursor-pointer text-xs"
            >
              ◀
            </button>
            <button
              onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
              className="p-1 sm:p-1.5 hover:bg-[#EFEAE0] rounded-lg cursor-pointer text-xs"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] sm:text-[11px] font-semibold text-[#6E726D] border-b border-[#EFEAE0] pb-2">
          <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div>
          <div>Kam</div><div>Jum</div><div>Sab</div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-1 sm:p-2"></div>
          ))}

          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const hasTodos = todos.some((t) => t.date === dateStr);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`py-2 px-1 sm:p-2 rounded-xl text-center relative transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2A5C43] text-white font-bold'
                    : 'hover:bg-[#EFEAE0] text-[#1C1E1B]'
                }`}
              >
                {day}
                {hasTodos && (
                  <span
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2 ${
                      isSelected ? 'bg-white' : 'bg-[#2A5C43]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel To-Do */}
      <div className="md:col-span-5 space-y-4">
        <div className="bg-[#F8F5EE] border border-[#EFEAE0] p-4 sm:p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-2.5">
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-[#1C1E1B]">
                Agenda Tanggal
              </h3>
              <p className="text-[10px] text-[#6E726D]">To-Do List</p>
            </div>
            <span className="text-[10px] bg-[#EFEAE0] text-[#1C1E1B] px-2 py-0.5 rounded-md font-mono">
              {selectedDate}
            </span>
          </div>

          <form onSubmit={handleAdd} className="space-y-2">
            <input
              type="text"
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              placeholder="Tambah tugas baru..."
              className="w-full px-3 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-[#EFEAE0] rounded-xl text-xs text-[#1C1E1B]"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#2A5C43] hover:bg-[#214935] text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shrink-0"
              >
                + Tambah
              </button>
            </div>
          </form>
        </div>

        {/* List Agenda */}
        <div className="space-y-2">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#EFEAE0] rounded-xl bg-[#F8F5EE]/40">
              <p className="text-xs text-[#6E726D]">Belum ada agenda di tanggal ini.</p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const folder = folders.find((f) => f.id === todo.folderId) || {
                name: 'Umum',
                color: '#2A5C43',
              };

              return (
                <div
                  key={todo.id}
                  className="p-3 bg-[#F8F5EE] border border-[#EFEAE0] rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => onToggleTodo(todo.id)}
                      className="w-4 h-4 rounded border-[#EFEAE0] text-[#2A5C43] cursor-pointer shrink-0"
                    />
                    <span
                      className={`text-xs text-[#1C1E1B] truncate ${
                        todo.completed ? 'line-through text-[#6E726D]' : ''
                      }`}
                    >
                      {todo.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-[9px] font-medium text-white px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: folder.color }}
                    >
                      {folder.name}
                    </span>
                    <button
                      onClick={() => onDeleteTodo(todo.id)}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}