"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Daftar rute autentikasi dan Landing Page yang tidak boleh menampilkan Sidebar
  const isAuthOrLanding =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/landing";

  // 1. Jika rute saat ini adalah /login, /register, atau /, render {children} saja secara penuh (full screen)
  if (isAuthOrLanding) {
    return (
      <main className="min-h-screen w-full bg-moya-bg">
        {children}
      </main>
    );
  }

  // 2. Jika bukan (halaman internal seperti /dashboard, /notes, /files, dll), render dengan komponen <Sidebar />
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
