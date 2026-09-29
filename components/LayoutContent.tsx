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
      <div className="w-full min-h-screen bg-moya-bg overflow-x-hidden">
        {children}
      </div>
    );
  }

  // 2. Jika bukan (halaman internal), gunakan tata letak responsif: flex-col pada mobile, md:flex-row pada desktop
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-moya-bg overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 w-full p-4 sm:p-6 md:p-8 lg:p-10 overflow-x-hidden">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
