"use client";

import { useMasterPassword } from "@/context/MasterPasswordContext";

export default function PrivateGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useMasterPassword();

  // Jika belum authenticated, rendering konten dicegah (sudah ditangani oleh modal di PrivateLayout)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
