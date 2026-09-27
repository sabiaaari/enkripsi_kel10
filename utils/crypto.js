// --- FUNGSI UTILITAS: Konversi Format ---
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binaryString = window.atob(base64);
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

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
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
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); 

  // 2. Turunkan kunci AES-256
  const key = await deriveKeyFromPassword(password, salt);

  // 3. Proses Enkripsi
  const encryptedData = await crypto.subtle.encrypt(
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
export async function decryptDiary(cipherText64Bundle, saltBase64, nonceBase64, password) {
  
// Ubah Base64 kembali ke format byte
  const cipherText = base64ToBuffer(cipherTextBase64);
  const salt = base64ToBuffer(saltBase64);
  const nonce = base64ToBuffer(nonceBase64);

  const key = await deriveKeyFromPassword(password, salt);


  // Proses Dekripsi (Otomatis memvalidasi Tag GCM untuk mencegah tampering)
  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    cipherText
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}