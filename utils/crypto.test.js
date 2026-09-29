/**
 * Uji Coba Kriptografi MOYA
 * Untuk dijalankan dengan Jest / Vitest (Node.js environment)
 */

import { encryptDiary, decryptDiary, bufferToBase64, base64ToBuffer } from "./crypto"; // Sesuaikan jalur file dengan proyek Anda
import { TextEncoder, TextDecoder } from "util";
import { webcrypto } from "crypto"; // Node.js native Web Crypto API

// Mocking lingkungan Web Crypto agar berjalan di Jest (Node.js)
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = webcrypto;
}
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

describe("Pengujian Inti Kriptografi MOYA (AES-256-GCM)", () => {
  const masterPassword = "SandiKuat_Moya123!";
  const sampleText = "Ini adalah pesan rahasia yang sangat krusial untuk proyek UTS.";
  
  // 1. Pengujian Keberhasilan Enkripsi (Kerahasiaan)
  it("Uji 1: Harus berhasil mengenkripsi teks dan menghasilkan ciphertext base64 yang valid", async () => {
    const result = await encryptDiary(sampleText, masterPassword);
    
    // Memastikan hasil tidak kosong
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.iv).toBeDefined();
    expect(result.salt).toBeDefined();
    
    // Memastikan ciphertext BUKANLAH teks asli (kerahasiaan terjamin)
    expect(result.content).not.toContain(sampleText);
    expect(typeof result.content).toBe("string");
  });

  // 2. Pengujian Keberhasilan Dekripsi (Lossless Integrity)
  it("Uji 2: Harus berhasil mendekripsi ciphertext kembali menjadi teks asli utuh (Lossless)", async () => {
    const encrypted = await encryptDiary(sampleText, masterPassword);
    
    // Proses dekripsi dengan kunci yang benar
    const decryptedText = await decryptDiary(
      encrypted.content,
      encrypted.salt,
      encrypted.iv,
      masterPassword
    );
    
    // Teks hasil dekripsi harus 100% sama persis dengan teks awal
    expect(decryptedText).toBe(sampleText);
  });

  // 3. Pengujian Kegagalan Dekripsi (Kunci Salah)
  it("Uji 3: Harus menolak dekripsi (melempar error) jika Master Password salah", async () => {
    const encrypted = await encryptDiary(sampleText, masterPassword);
    const wrongPassword = "SandiYangSalah123";

    // Memastikan fungsi melempar pesan error saat kata sandi salah
    await expect(
      decryptDiary(encrypted.content, encrypted.salt, encrypted.iv, wrongPassword)
    ).rejects.toThrow("Gagal mendekripsi berkas: Master Password salah atau integritas data/auth_tag telah rusak!");
  });

  // 4. Pengujian Integritas IV/Nonce (Semantik Kriptografi)
  it("Uji 4: Harus menghasilkan IV (Nonce) yang unik sebesar tepat 12-byte setiap kali eksekusi", async () => {
    const result1 = await encryptDiary(sampleText, masterPassword);
    const result2 = await encryptDiary(sampleText, masterPassword);
    
    // Konversi base64 kembali ke byte
    const ivBytes1 = base64ToBuffer(result1.iv);
    const ivBytes2 = base64ToBuffer(result2.iv);
    
    // Sesuai standar GCM, IV harus sepanjang 12 byte
    expect(ivBytes1.byteLength).toBe(12);
    expect(ivBytes2.byteLength).toBe(12);
    
    // Meskipun input/password sama, IV harus selalu beda (Semantic Security)
    expect(result1.iv).not.toBe(result2.iv);
    expect(result1.content).not.toBe(result2.content); // Ciphertext juga pasti ikut berubah
  });

  // 5. Pengujian Ketahanan Modifikasi / Tampering (Autentikasi GCM)
  it("Uji 5: Harus menolak dekripsi jika ciphertext telah dimodifikasi secara sepihak (Tampering Detected)", async () => {
    const encrypted = await encryptDiary(sampleText, masterPassword);
    
    // Simulasikan serangan: Ubah satu karakter saja di dalam ciphertext base64
    let tamperedContent = encrypted.content;
    const charToChange = tamperedContent[5] === 'A' ? 'B' : 'A';
    tamperedContent = tamperedContent.substring(0, 5) + charToChange + tamperedContent.substring(6);

    // Proses dekripsi dengan kunci yang BENAR, tetapi data sudah diubah
    // Tag GCM akan gagal diverifikasi
    await expect(
      decryptDiary(tamperedContent, encrypted.salt, encrypted.iv, masterPassword)
    ).rejects.toThrow("Gagal mendekripsi berkas: Master Password salah atau integritas data/auth_tag telah rusak!");
  });
});