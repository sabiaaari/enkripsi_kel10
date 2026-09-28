"use client";

import { useEffect } from "react";
import { useMasterPassword } from "@/context/MasterPasswordContext";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { masterPassword, requestMasterPassword } =
    useMasterPassword();

  // Otomatis buka modal Master Password jika pengguna masuk ke rute /private tanpa sandi di RAM
  useEffect(() => {
    if (!masterPassword) {
      requestMasterPassword();
    }
  }, [masterPassword, requestMasterPassword]);

  // Jika masterPassword KOSONG: tampilkan layar terkunci dengan tombol pemicu modal
  if (!masterPassword) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-moya-soft text-moya-primarydark flex items-center justify-center text-3xl mx-auto shadow-card">
          🔒
        </div>
        <div>
          <p className="text-sm text-moya-muted leading-relaxed">
            This section is protected with end-to-end encryption.
          </p>
        </div>
        <button
          onClick={() => requestMasterPassword()}
          className="px-6 py-3 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl text-sm font-medium transition-colors shadow-card flex items-center gap-2 mx-auto"
        >
          <span>🔐</span> Enter Master Password to Unlock
        </button>
      </div>
    );
  }

  // Jika masterPassword SUDAH ADA di RAM: render halaman
  return <>{children}</>;
}
