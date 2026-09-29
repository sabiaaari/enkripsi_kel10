/**
 * Utilitas Kriptografi MOYA
 * Implementasi Inti: Web Crypto API (AES-256-GCM & PBKDF2)
 */

const cryptoInstance =
  typeof window !== "undefined" && window.crypto
    ? window.crypto
    : typeof globalThis !== "undefined" && globalThis.crypto
    ? globalThis.crypto
    : undefined;

// ==========================================
// 1. FUNGSI UTILITAS: bufferToBase64 & base64ToBuffer
// ==========================================

export function bufferToBase64(buffer) {
  if (!buffer) return "";
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return (typeof window !== "undefined" ? window.btoa : globalThis.btoa)(binary);
}

export function base64ToBuffer(base64) {
  if (!base64 || typeof base64 !== "string") {
    return new Uint8Array(0);
  }
  const cleanBase64 = base64.trim().replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(cleanBase64, "base64"));
  }
  const binaryString = (typeof window !== "undefined" ? window.atob : globalThis.atob)(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ==========================================
// 2. FUNGSI KDF: deriveKeyFromPassword (PBKDF2)
// ==========================================

export async function deriveKeyFromPassword(password, salt, iterations = 600000) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = typeof salt === "string" ? base64ToBuffer(salt) : salt;

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
      salt: saltBuffer,
      iterations: iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ==========================================
// 3. FUNGSI ENKRIPSI: encryptDiary (AES-256-GCM)
// ==========================================

export async function encryptDiary(plainInput, masterPassword) {
  if (!masterPassword || typeof masterPassword !== "string") {
    throw new Error("Master Password wajib diisi untuk melakukan enkripsi.");
  }

  let data;
  if (typeof plainInput === "string") {
    data = new TextEncoder().encode(plainInput);
  } else if (plainInput instanceof ArrayBuffer) {
    data = new Uint8Array(plainInput);
  } else if (ArrayBuffer.isView(plainInput)) {
    data = new Uint8Array(plainInput.buffer, plainInput.byteOffset, plainInput.byteLength);
  } else {
    throw new Error("Data yang akan dienkripsi harus berupa string atau buffer biner.");
  }

  // Bangkitkan Salt (16-byte) dan IV (12-byte) acak
  const salt = cryptoInstance.getRandomValues(new Uint8Array(16));
  const iv = cryptoInstance.getRandomValues(new Uint8Array(12));

  // Derivasi kunci AES-256 dari Master Password (PBKDF2 600.000 iterasi)
  const key = await deriveKeyFromPassword(masterPassword, salt, 600000);

  // Enkripsi AES-256-GCM
  const encryptedData = await cryptoInstance.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );

  const encryptedBytes = new Uint8Array(encryptedData);
  const tagLength = 16;
  const authTagBytes = encryptedBytes.slice(encryptedBytes.length - tagLength);

  return {
    content: bufferToBase64(encryptedData),
    ciphertext: encryptedBytes,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    nonce: bufferToBase64(iv),
    authTag: bufferToBase64(authTagBytes),
    algorithm: "AES-256-GCM",
  };
}

// ==========================================
// 4. FUNGSI DEKRIPSI: decryptDiary (AES-256-GCM)
// ==========================================

export async function decryptDiary(cipherInput, saltInput, ivInput, masterPassword, authTagInput) {
  let cipher = cipherInput;
  let salt = saltInput;
  let iv = ivInput;
  let pass = masterPassword;
  let tag = authTagInput;

  // Dukungan jika objek bundle dilewatkan sebagai argumen pertama
  if (
    typeof cipherInput === "object" &&
    cipherInput !== null &&
    !(cipherInput instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(cipherInput)
  ) {
    cipher = cipherInput.content || cipherInput.ciphertext;
    salt = cipherInput.salt;
    iv = cipherInput.nonce || cipherInput.iv;
    tag = cipherInput.auth_tag || cipherInput.authTag;
    pass = saltInput;
  }

  if (!cipher || !salt || !iv || !pass) {
    throw new Error("Parameter dekripsi tidak lengkap (ciphertext, salt, iv, atau password kosong).");
  }

  const isBinary = cipher instanceof ArrayBuffer || ArrayBuffer.isView(cipher);
  const cipherBytes = isBinary
    ? cipher instanceof ArrayBuffer
      ? new Uint8Array(cipher)
      : new Uint8Array(cipher.buffer, cipher.byteOffset, cipher.byteLength)
    : base64ToBuffer(cipher);

  const saltBuffer = typeof salt === "string" ? base64ToBuffer(salt) : salt;
  const ivBuffer = typeof iv === "string" ? base64ToBuffer(iv) : iv;

  const iterationList = [600000, 100000];

  for (const iters of iterationList) {
    try {
      const key = await deriveKeyFromPassword(pass, saltBuffer, iters);

      try {
        const decryptedData = await cryptoInstance.subtle.decrypt(
          { name: "AES-GCM", iv: ivBuffer },
          key,
          cipherBytes
        );
        return isBinary ? decryptedData : new TextDecoder().decode(decryptedData);
      } catch (directErr) {
        if (tag) {
          const tagBytes = typeof tag === "string" ? base64ToBuffer(tag) : new Uint8Array(tag);
          const combined = new Uint8Array(cipherBytes.byteLength + tagBytes.byteLength);
          combined.set(cipherBytes, 0);
          combined.set(tagBytes, cipherBytes.byteLength);

          const decryptedData = await cryptoInstance.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            key,
            combined
          );
          return isBinary ? decryptedData : new TextDecoder().decode(decryptedData);
        }
        throw directErr;
      }
    } catch {
      // Coba iterasi berikutnya jika ada
    }
  }

  throw new Error("Gagal mendekripsi berkas: Master Password salah atau integritas data/auth_tag telah rusak!");
}

export async function encryptAvalancheTest(
  plainInput,
  passwordA,
  passwordB
) {
  if (!passwordA || !passwordB) {
    throw new Error("Password A dan Password B wajib diisi.");
  }

  if (passwordA === passwordB) {
    throw new Error("Password A dan Password B harus berbeda.");
  }

  let data;

  if (plainInput instanceof ArrayBuffer) {
    data = new Uint8Array(plainInput);
  } else if (ArrayBuffer.isView(plainInput)) {
    data = new Uint8Array(
      plainInput.buffer,
      plainInput.byteOffset,
      plainInput.byteLength
    );
  } else {
    throw new Error("Input harus berupa ArrayBuffer atau Uint8Array.");
  }

  // KHUSUS PENGUJIAN AVALANCHE EFFECT
  // Salt dan IV dibuat sama untuk kedua enkripsi.
  const salt = cryptoInstance.getRandomValues(
    new Uint8Array(16)
  );

  const iv = cryptoInstance.getRandomValues(
    new Uint8Array(12)
  );

  const keyA = await deriveKeyFromPassword(
    passwordA,
    salt,
    600000
  );

  const keyB = await deriveKeyFromPassword(
    passwordB,
    salt,
    600000
  );

  const encryptedA = await cryptoInstance.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    keyA,
    data
  );

  const encryptedB = await cryptoInstance.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    keyB,
    data
  );

  const cipherA = new Uint8Array(encryptedA);
  const cipherB = new Uint8Array(encryptedB);

  const minLength = Math.min(
    cipherA.length,
    cipherB.length
  );

  let hammingDistance = 0;

  for (let i = 0; i < minLength; i++) {
    let xor = cipherA[i] ^ cipherB[i];

    while (xor !== 0) {
      hammingDistance += xor & 1;
      xor >>>= 1;
    }
  }

  const totalBits = minLength * 8;

  const percentage =
    totalBits > 0
      ? (hammingDistance / totalBits) * 100
      : 0;

  return {
    ciphertextA: cipherA,
    ciphertextB: cipherB,
    salt: bufferToBase64(salt),
    nonce: bufferToBase64(iv),
    hammingDistance,
    totalBits,
    percentage,
  };
}
