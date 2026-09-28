/**
 * MOYA Zero-Knowledge Cryptography Engine
 * Menggunakan Web Crypto API murni (Client-Side Only)
 * 
 * Standar Keamanan:
 * - Algoritma Kunci: AES-256-GCM (Authenticated Encryption with Associated Data)
 * - Key Derivation Function (KDF): PBKDF2 dengan SHA-256 dan 600.000 iterasi (sesuai rekomendasi OWASP)
 * - Salt: 16-byte kriptografis acak per operasi
 * - IV / Nonce: 12-byte kriptografis acak per operasi (standar GCM)
 * 
 * ATURAN MUTLAK:
 * Sandi (masterPassword) tidak pernah dikirim ke backend / Supabase.
 * Enkripsi & Dekripsi terjadi 100% di memori RAM peramban (client).
 */

const cryptoInstance =
  typeof window !== "undefined" && window.crypto
    ? window.crypto
    : typeof globalThis !== "undefined" && globalThis.crypto
    ? globalThis.crypto
    : undefined;

// --- FUNGSI UTILITAS: Konversi Format ---
export function bufferToBase64(buffer) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return (typeof window !== "undefined" ? window.btoa : globalThis.btoa)(binary);
}

export function base64ToBuffer(base64) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binaryString = (typeof window !== "undefined" ? window.atob : globalThis.atob)(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- FUNGSI 1: KDF (PBKDF2) ---
// Menurunkan kunci AES-256 dari string Master Password dan Salt
async function deriveKeyFromPassword(password, salt) {
  if (!password || typeof password !== "string") {
    throw new Error("Master Password tidak valid atau belum diisi.");
  }
  if (!cryptoInstance || !cryptoInstance.subtle) {
    throw new Error("Web Crypto API (crypto.subtle) tidak didukung pada peramban ini.");
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await cryptoInstance.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await cryptoInstance.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000, 
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 }, 
    false, 
    ["encrypt", "decrypt"]
  );
}

// --- FUNGSI 2: ENKRIPSI (Export untuk Frontend) ---
// Menerima plainText (teks atau Base64 file) dan masterPassword dari Context
export async function encryptDiary(plainText, masterPassword) {
  if (!masterPassword || typeof masterPassword !== "string") {
    throw new Error("Master Password wajib diisi untuk melakukan enkripsi.");
  }
  if (typeof plainText !== "string") {
    throw new Error("Data yang akan dienkripsi harus bertipe teks string.");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  
  // 1. Bangkitkan Salt (16-byte) dan IV (12-byte) unik acak
  const salt = cryptoInstance.getRandomValues(new Uint8Array(16));
  const iv = cryptoInstance.getRandomValues(new Uint8Array(12)); 

  // 2. Turunkan kunci AES-256 dari Master Password
  const key = await deriveKeyFromPassword(masterPassword, salt);

  // 3. Proses Enkripsi AES-256-GCM
  const encryptedData = await cryptoInstance.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  const encryptedBytes = new Uint8Array(encryptedData);
  const tagLength = 16;
  const authTagBytes = encryptedBytes.slice(encryptedBytes.length - tagLength);

  // Mengembalikan dalam format Base64 yang siap disimpan ke kolom tabel Supabase
  return {
    content: bufferToBase64(encryptedData), // Ciphertext dalam Base64
    salt: bufferToBase64(salt),            // Salt unik dalam Base64
    iv: bufferToBase64(iv),                // IV dalam Base64
    nonce: bufferToBase64(iv),             // Nonce dalam Base64 (sinonim iv)
    authTag: bufferToBase64(authTagBytes), // 16-byte Authentication Tag dalam Base64
    algorithm: "AES-256-GCM",
  };
}

// --- FUNGSI 3: DEKRIPSI (Export untuk Frontend) ---
// Menerima cipherTextBase64, salt, iv, masterPassword dari Context, dan authTagBase64 (opsional)
export async function decryptDiary(cipherTextBase64, saltBase64, ivBase64, masterPassword, authTagBase64) {
  let cipher = cipherTextBase64;
  let salt = saltBase64;
  let iv = ivBase64;
  let pass = masterPassword;
  let tag = authTagBase64;

  // Mendukung pemanggilan fleksibel jika bundle objek dilewatkan sebagai argumen pertama
  if (typeof cipherTextBase64 === "object" && cipherTextBase64 !== null) {
    cipher = cipherTextBase64.content;
    salt = cipherTextBase64.salt;
    iv = cipherTextBase64.nonce || cipherTextBase64.iv;
    tag = cipherTextBase64.auth_tag || cipherTextBase64.authTag;
    pass = saltBase64; // argumen kedua adalah password jika argumen pertama objek
  }

  if (!pass || typeof pass !== "string") {
    throw new Error("Master Password wajib diisi untuk melakukan dekripsi.");
  }
  if (!cipher || !salt || !iv) {
    throw new Error("Parameter kriptografi tidak lengkap (membutuhkan ciphertext, salt, dan iv).");
  }

  // Ubah Base64 kembali ke format byte buffer
  const cipherText = base64ToBuffer(cipher);
  const saltBuffer = base64ToBuffer(salt);
  const ivBuffer = base64ToBuffer(iv);

  const key = await deriveKeyFromPassword(pass, saltBuffer);

  // Proses Dekripsi AES-256-GCM (Otomatis memvalidasi GCM Authentication Tag)
  try {
    const decryptedData = await cryptoInstance.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      key,
      cipherText
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (err) {
    // Jika authTag disimpan terpisah dan belum tergabung di cipherText
    if (tag) {
      try {
        const tagBuffer = base64ToBuffer(tag);
        const combined = new Uint8Array(cipherText.byteLength + tagBuffer.byteLength);
        combined.set(cipherText, 0);
        combined.set(tagBuffer, cipherText.byteLength);

        const decryptedData = await cryptoInstance.subtle.decrypt(
          { name: "AES-GCM", iv: ivBuffer },
          key,
          combined
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
      } catch (innerErr) {
        // Lanjutkan ke throw error
      }
    }
    throw new Error("Gagal mendekripsi: Master Password salah atau integritas data telah rusak/dimanipulasi!");
  }
}

// --- FUNGSI 4: KONVERSI FILE KE BASE64 (FileReader API) ---
export function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Objek fail tidak valid atau kosong."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

// --- FUNGSI 5: ENKRIPSI FILE BINER (AES-256-GCM + PBKDF2) UNTUK SUPABASE STORAGE ---
/**
 * Mengenkripsi buffer biner berkas (ArrayBuffer) menggunakan AES-256-GCM.
 * Memisahkan ciphertext murni dan 16-byte Authentication Tag untuk kepatuhan skema tabel.
 *
 * @param {ArrayBuffer} arrayBuffer - Buffer berkas asli
 * @param {string} masterPassword - Master password dari context
 * @returns {Promise<{ ciphertext: Uint8Array, salt: string, nonce: string, authTag: string }>}
 */
export async function encryptFileBuffer(arrayBuffer, masterPassword) {
  if (!masterPassword || typeof masterPassword !== "string") {
    throw new Error("Master Password wajib diisi untuk melakukan enkripsi.");
  }
  if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
    throw new Error("Data yang akan dienkripsi harus berupa ArrayBuffer.");
  }

  // 1. Salt (16-byte) dan IV / Nonce (12-byte) kriptografis acak
  const salt = cryptoInstance.getRandomValues(new Uint8Array(16));
  const iv = cryptoInstance.getRandomValues(new Uint8Array(12));

  // 2. Turunkan kunci AES-256 menggunakan PBKDF2 (600.000 iterasi)
  const key = await deriveKeyFromPassword(masterPassword, salt);

  // 3. Enkripsi dengan AES-256-GCM (Web Crypto API menghasilkan ciphertext + 16 bytes auth tag di ujung)
  const encryptedBuffer = await cryptoInstance.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    arrayBuffer
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const tagLength = 16; // 128-bit authentication tag standard
  const authTagBytes = encryptedBytes.slice(encryptedBytes.length - tagLength);

  return {
    ciphertext: encryptedBytes, // Uint8Array lengkap dengan auth tag di akhir (standar Web Crypto AES-GCM)
    salt: bufferToBase64(salt),
    nonce: bufferToBase64(iv),
    authTag: bufferToBase64(authTagBytes),
  };
}

// --- FUNGSI 6: DEKRIPSI FILE BINER DARI SUPABASE STORAGE ---
/**
 * Mendekripsi berkas biner dari Supabase Storage menggunakan metadata tabel encrypted_files.
 *
 * @param {ArrayBuffer} ciphertextBuffer - Buffer ciphertext dari Storage
 * @param {string} saltBase64 - Salt Base64 dari tabel
 * @param {string} nonceBase64 - Nonce/IV Base64 dari tabel
 * @param {string} authTagBase64 - Auth tag Base64 dari tabel (jika dipisah)
 * @param {string} masterPassword - Master password pengguna
 * @returns {Promise<ArrayBuffer>} Buffer berkas asli yang telah didekripsi
 */
export async function decryptFileBuffer(
  ciphertextBuffer,
  saltBase64,
  nonceBase64,
  authTagBase64,
  masterPassword
) {
  if (!masterPassword || typeof masterPassword !== "string") {
    throw new Error("Master Password wajib diisi untuk melakukan dekripsi.");
  }
  if (!saltBase64 || !nonceBase64) {
    throw new Error("Parameter kriptografi (salt / nonce) tidak lengkap.");
  }

  const salt = base64ToBuffer(saltBase64);
  const iv = base64ToBuffer(nonceBase64);
  const ciphertext = new Uint8Array(ciphertextBuffer);

  let dataToDecrypt = ciphertext;

  // Jika authTag disimpan terpisah di database, gabungkan kembali sebelum subtle.decrypt
  if (authTagBase64) {
    const authTag = base64ToBuffer(authTagBase64);
    const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
    combined.set(ciphertext, 0);
    combined.set(authTag, ciphertext.byteLength);
    dataToDecrypt = combined;
  }

  const key = await deriveKeyFromPassword(masterPassword, salt);

  try {
    const decryptedBuffer = await cryptoInstance.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      dataToDecrypt
    );

    return decryptedBuffer;
  } catch (err) {
    throw new Error(
      "Gagal mendekripsi berkas: Master Password salah atau integritas data/auth_tag telah rusak!"
    );
  }
}