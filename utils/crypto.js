const cryptoInstance =
  typeof window !== "undefined" && window.crypto
    ? window.crypto
    : typeof globalThis !== "undefined" && globalThis.crypto
    ? globalThis.crypto
    : undefined;

// --- FUNGSI UTILITAS: Konversi Format ---
function bufferToBase64(buffer) {
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

function base64ToBuffer(base64) {
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
async function deriveKeyFromPassword(password, salt) {
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
export async function encryptDiary(plainText, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  
  // 1. Bangkitkan Salt dan IV unik
  const salt = cryptoInstance.getRandomValues(new Uint8Array(16));
  const iv = cryptoInstance.getRandomValues(new Uint8Array(12)); 

  // 2. Turunkan kunci AES-256
  const key = await deriveKeyFromPassword(password, salt);

  // 3. Proses Enkripsi
  const encryptedData = await cryptoInstance.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  // Mengembalikan dalam bentuk objek terpisah agar sesuai dengan tabel Supabase
  return {
    content: bufferToBase64(encryptedData), // Cipherteks dalam Base64
    salt: bufferToBase64(salt), // Salt dalam Base64
    iv: bufferToBase64(iv) // IV dalam Base64
  };
}


// --- FUNGSI 3: DEKRIPSI (Export untuk Frontend) ---
export async function decryptDiary(cipherTextBase64, saltBase64, ivBase64, password) {
  let cipher = cipherTextBase64;
  let salt = saltBase64;
  let iv = ivBase64;
  let pass = password;

  // Mendukung pemanggilan fleksibel jika bundle objek dilewatkan sebagai argumen pertama
  if (typeof cipherTextBase64 === "object" && cipherTextBase64 !== null) {
    cipher = cipherTextBase64.content;
    salt = cipherTextBase64.salt;
    iv = cipherTextBase64.iv || cipherTextBase64.nonce;
    pass = saltBase64;
  }

  // Ubah Base64 kembali ke format byte
  const cipherText = base64ToBuffer(cipher);
  const saltBuffer = base64ToBuffer(salt);
  const ivBuffer = base64ToBuffer(iv);

  const key = await deriveKeyFromPassword(pass, saltBuffer);

  // Proses Dekripsi (Otomatis memvalidasi Tag GCM untuk mencegah tampering)
  try {
    const decryptedData = await cryptoInstance.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      key,
      cipherText
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (err) {
    throw new Error("Gagal mendekripsi: Kata sandi salah atau data telah dimanipulasi!");
  }
}