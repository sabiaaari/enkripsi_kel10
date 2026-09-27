'use client';

import { useState } from 'react';

export default function AuthForm({ onLogin, onGoogleAuth }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: isRegisterMode ? name : email.split('@')[0],
      email,
    });
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-[#F8F5EE] border border-[#EFEAE0] rounded-2xl space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-[#1C1E1B]">
          {isRegisterMode ? 'Buat Akun Baru' : 'Selamat Datang Kembali'}
        </h2>
        <p className="text-xs text-[#6E726D]">
          {isRegisterMode
            ? 'Daftar untuk menyimpan catatan terenkripsi'
            : 'Masuk untuk mengakses catatan dan agendamu'}
        </p>
      </div>

      <button
        onClick={onGoogleAuth}
        className="w-full py-2.5 px-4 bg-white border border-[#EFEAE0] hover:bg-[#F3EFE6] text-[#1C1E1B] font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        Lanjutkan dengan Google
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#EFEAE0] w-full"></div>
        <span className="bg-[#F8F5EE] px-3 text-[11px] text-[#6E726D] absolute">
          atau email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegisterMode && (
          <div>
            <label className="block text-xs font-medium text-[#4A4E49] mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ila"
              className="w-full px-3.5 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2A5C43]/20"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-[#4A4E49] mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ila@example.com"
            className="w-full px-3.5 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2A5C43]/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A4E49] mb-1">
            Kata Sandi
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-3.5 py-2 bg-white border border-[#EFEAE0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2A5C43]/20"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-[#2A5C43] hover:bg-[#214935] text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
        >
          {isRegisterMode ? 'Daftar' : 'Masuk'}
        </button>
      </form>

      <div className="text-center pt-2">
        <button
          onClick={() => setIsRegisterMode(!isRegisterMode)}
          className="text-xs text-[#2A5C43] hover:underline font-medium cursor-pointer"
        >
          {isRegisterMode
            ? 'Sudah punya akun? Masuk di sini'
            : 'Belum punya akun? Daftar sekarang'}
        </button>
      </div>
    </div>
  );
}