'use client';

import Image from 'next/image';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="border-b border-[#E6D7C3] bg-[#F9F3EA]/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex justify-between items-center">
        {/* Identitas Brand MOYA */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative overflow-hidden rounded-xl border border-[#E6D7C3] bg-[#F2E7D9] flex items-center justify-center shrink-0">
            {/* Ganti /logo.png dengan path gambar logo kamu di folder public */}
            <Image
              src="/logo.png"
              alt="MOYA Logo"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-[#4A3525] tracking-tight leading-tight">
              MOYA
            </h1>
            <p className="text-[10px] sm:text-[11px] text-[#8C7361] font-medium leading-none">
              a little space for your thoughts
            </p>
          </div>
        </div>

        {/* User Status / Action Button */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-[#4A3525] truncate max-w-[100px] sm:max-w-none">
                {user.name}
              </p>
              <p className="text-[10px] text-[#8C7361] hidden sm:block">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-xs font-medium bg-[#E6D7C3] hover:bg-[#D9C6B0] text-[#4A3525] px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Keluar
            </button>
          </div>
        ) : (
          <span className="text-[11px] sm:text-xs font-medium bg-[#E6D7C3] text-[#4A3525] px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C29283] animate-pulse"></span> Mode Tamu
          </span>
        )}
      </div>
    </header>
  );
}