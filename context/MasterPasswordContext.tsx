"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";

interface MasterPasswordContextType {
  /** Nilai master password di memori (RAM). Bernilai null jika belum dibuka */
  masterPassword: string | null;
  /** Status keterbukaan pop-up modal Master Password */
  isModalOpen: boolean;
  /** Membuka pop-up modal Master Password */
  openModal: () => void;
  /** Menyimpan master password ke RAM dan menutup modal */
  setMasterPassword: (pwd: string) => void;
  /** Menghapus master password dari memori (mengunci kembali brankas) */
  clearMasterPassword: () => void;
  /**
   * Memicu modal terbuka untuk meminta sandi kepada pengguna.
   * Mengembalikan Promise yang resolve ke string sandi (atau null jika pengguna membatalkan).
   */
  requestMasterPassword: () => Promise<string | null>;
  /** Menutup modal tanpa menyimpan sandi baru */
  closeModal: () => void;
  /** Status apakah brankas sedang dalam kondisi terbuka (memiliki sandi di RAM) */
  isAuthenticated: boolean;
}

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(
  undefined
);

export function MasterPasswordProvider({ children }: { children: ReactNode }) {
  // ATURAN MUTLAK ZERO-KNOWLEDGE:
  // Sandi HANYA disimpan di memori React State (RAM peramban).
  // Jangan pernah disimpan di localStorage, cookie, atau dikirim ke backend/Supabase.
  const [masterPassword, setMasterPasswordState] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Menyimpan fungsi resolver promise agar pemanggil requestMasterPassword() dapat menunggu input pengguna
  const pendingResolverRef = useRef<((pwd: string | null) => void) | null>(null);

  const setMasterPassword = useCallback((pwd: string) => {
    const trimmed = pwd.trim();
    setMasterPasswordState(trimmed || null);
    setIsModalOpen(false);

    if (pendingResolverRef.current) {
      pendingResolverRef.current(trimmed || null);
      pendingResolverRef.current = null;
    }
  }, []);

  const clearMasterPassword = useCallback(() => {
    setMasterPasswordState(null);
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    if (pendingResolverRef.current) {
      pendingResolverRef.current(null);
      pendingResolverRef.current = null;
    }
  }, []);

  const requestMasterPassword = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      // Jika masterPassword sudah ada di RAM, langsung resolve
      if (masterPassword) {
        resolve(masterPassword);
        return;
      }

      // Jika belum ada, simpan resolver dan buka modal
      pendingResolverRef.current = resolve;
      setIsModalOpen(true);
    });
  }, [masterPassword]);

  return (
    <MasterPasswordContext.Provider
      value={{
        masterPassword,
        isModalOpen,
        openModal,
        setMasterPassword,
        clearMasterPassword,
        requestMasterPassword,
        closeModal,
        isAuthenticated: Boolean(masterPassword),
      }}
    >
      {children}
    </MasterPasswordContext.Provider>
  );
}

export function useMasterPassword() {
  const context = useContext(MasterPasswordContext);
  if (!context) {
    throw new Error(
      "useMasterPassword must be used within a MasterPasswordProvider"
    );
  }
  return context;
}
