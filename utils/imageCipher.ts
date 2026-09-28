/**
 * Utility untuk demonstrasi visualisasi enkripsi citra
 * Mengimplementasikan AES-128-ECB dan Mode Aman (CBC/GCM ber-IV) pada piksel RGBA HTML5 Canvas.
 */

// S-Box standar Rijndael (AES)
const SBOX = new Uint8Array([
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5e, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]);

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

export function expandKey(key: Uint8Array): Uint32Array {
  const w = new Uint32Array(44);
  for (let i = 0; i < 4; i++) {
    w[i] = (key[4 * i] << 24) | (key[4 * i + 1] << 16) | (key[4 * i + 2] << 8) | key[4 * i + 3];
  }
  for (let i = 4; i < 44; i++) {
    let temp = w[i - 1];
    if (i % 4 === 0) {
      const rot = ((temp << 8) | (temp >>> 24)) >>> 0;
      temp =
        (SBOX[(rot >>> 24) & 0xff] << 24) |
        (SBOX[(rot >>> 16) & 0xff] << 16) |
        (SBOX[(rot >>> 8) & 0xff] << 8) |
        SBOX[rot & 0xff];
      temp ^= (RCON[(i / 4) - 1] << 24);
      temp >>>= 0;
    }
    w[i] = (w[i - 4] ^ temp) >>> 0;
  }
  return w;
}

function xtime(a: number): number {
  return ((a << 1) ^ (((a >>> 7) & 1) * 0x11b)) & 0xff;
}

export function encryptBlock(
  input: Uint8Array | Uint8ClampedArray,
  inOff: number,
  output: Uint8Array | Uint8ClampedArray,
  outOff: number,
  w: Uint32Array
): void {
  let s0 = input[inOff] ^ (w[0] >>> 24);
  let s1 = input[inOff + 1] ^ ((w[0] >>> 16) & 0xff);
  let s2 = input[inOff + 2] ^ ((w[0] >>> 8) & 0xff);
  let s3 = input[inOff + 3] ^ (w[0] & 0xff);

  let s4 = input[inOff + 4] ^ (w[1] >>> 24);
  let s5 = input[inOff + 5] ^ ((w[1] >>> 16) & 0xff);
  let s6 = input[inOff + 6] ^ ((w[1] >>> 8) & 0xff);
  let s7 = input[inOff + 7] ^ (w[1] & 0xff);

  let s8 = input[inOff + 8] ^ (w[2] >>> 24);
  let s9 = input[inOff + 9] ^ ((w[2] >>> 16) & 0xff);
  let s10 = input[inOff + 10] ^ ((w[2] >>> 8) & 0xff);
  let s11 = input[inOff + 11] ^ (w[2] & 0xff);

  let s12 = input[inOff + 12] ^ (w[3] >>> 24);
  let s13 = input[inOff + 13] ^ ((w[3] >>> 16) & 0xff);
  let s14 = input[inOff + 14] ^ ((w[3] >>> 8) & 0xff);
  let s15 = input[inOff + 15] ^ (w[3] & 0xff);

  for (let round = 1; round < 10; round++) {
    const t0 = SBOX[s0], t1 = SBOX[s5], t2 = SBOX[s10], t3 = SBOX[s15];
    const t4 = SBOX[s4], t5 = SBOX[s9], t6 = SBOX[s14], t7 = SBOX[s3];
    const t8 = SBOX[s8], t9 = SBOX[s13], t10 = SBOX[s2], t11 = SBOX[s7];
    const t12 = SBOX[s12], t13 = SBOX[s1], t14 = SBOX[s6], t15 = SBOX[s11];

    const w0 = w[4 * round], w1 = w[4 * round + 1], w2 = w[4 * round + 2], w3 = w[4 * round + 3];

    s0 = xtime(t0 ^ t1) ^ t1 ^ t2 ^ t3 ^ (w0 >>> 24);
    s1 = xtime(t1 ^ t2) ^ t2 ^ t3 ^ t0 ^ ((w0 >>> 16) & 0xff);
    s2 = xtime(t2 ^ t3) ^ t3 ^ t0 ^ t1 ^ ((w0 >>> 8) & 0xff);
    s3 = xtime(t3 ^ t0) ^ t0 ^ t1 ^ t2 ^ (w0 & 0xff);

    s4 = xtime(t4 ^ t5) ^ t5 ^ t6 ^ t7 ^ (w1 >>> 24);
    s5 = xtime(t5 ^ t6) ^ t6 ^ t7 ^ t4 ^ ((w1 >>> 16) & 0xff);
    s6 = xtime(t6 ^ t7) ^ t7 ^ t4 ^ t5 ^ ((w1 >>> 8) & 0xff);
    s7 = xtime(t7 ^ t4) ^ t4 ^ t5 ^ t6 ^ (w1 & 0xff);

    s8 = xtime(t8 ^ t9) ^ t9 ^ t10 ^ t11 ^ (w2 >>> 24);
    s9 = xtime(t9 ^ t10) ^ t10 ^ t11 ^ t8 ^ ((w2 >>> 16) & 0xff);
    s10 = xtime(t10 ^ t11) ^ t11 ^ t8 ^ t9 ^ ((w2 >>> 8) & 0xff);
    s11 = xtime(t11 ^ t8) ^ t8 ^ t9 ^ t10 ^ (w2 & 0xff);

    s12 = xtime(t12 ^ t13) ^ t13 ^ t14 ^ t15 ^ (w3 >>> 24);
    s13 = xtime(t13 ^ t14) ^ t14 ^ t15 ^ t12 ^ ((w3 >>> 16) & 0xff);
    s14 = xtime(t14 ^ t15) ^ t15 ^ t12 ^ t13 ^ ((w3 >>> 8) & 0xff);
    s15 = xtime(t15 ^ t12) ^ t12 ^ t13 ^ t14 ^ (w3 & 0xff);
  }

  const w40 = w[40], w41 = w[41], w42 = w[42], w43 = w[43];

  output[outOff] = SBOX[s0] ^ (w40 >>> 24);
  output[outOff + 1] = SBOX[s5] ^ ((w40 >>> 16) & 0xff);
  output[outOff + 2] = SBOX[s10] ^ ((w40 >>> 8) & 0xff);
  output[outOff + 3] = SBOX[s15] ^ (w40 & 0xff);

  output[outOff + 4] = SBOX[s4] ^ (w41 >>> 24);
  output[outOff + 5] = SBOX[s9] ^ ((w41 >>> 16) & 0xff);
  output[outOff + 6] = SBOX[s14] ^ ((w41 >>> 8) & 0xff);
  output[outOff + 7] = SBOX[s3] ^ (w41 & 0xff);

  output[outOff + 8] = SBOX[s8] ^ (w42 >>> 24);
  output[outOff + 9] = SBOX[s13] ^ ((w42 >>> 16) & 0xff);
  output[outOff + 10] = SBOX[s2] ^ ((w42 >>> 8) & 0xff);
  output[outOff + 11] = SBOX[s7] ^ (w42 & 0xff);

  output[outOff + 12] = SBOX[s12] ^ (w43 >>> 24);
  output[outOff + 13] = SBOX[s1] ^ ((w43 >>> 16) & 0xff);
  output[outOff + 14] = SBOX[s6] ^ ((w43 >>> 8) & 0xff);
  output[outOff + 15] = SBOX[s11] ^ (w43 & 0xff);
}

/**
 * Enkripsi piksel RGBA menggunakan AES-128-ECB
 * Setiap blok 16 byte (4 piksel) dienkripsi secara independen tanpa IV.
 * Blok warna yang identik akan menghasilkan ciphertext yang identik (pola/siluet terlihat).
 */
export function encryptPixelsECB(
  rgbaPixels: Uint8ClampedArray,
  key: Uint8Array = new Uint8Array([0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c])
): Uint8ClampedArray {
  const expKey = expandKey(key);
  const total = rgbaPixels.length;
  const out = new Uint8ClampedArray(total);
  const blockCount = Math.floor(total / 16);

  for (let i = 0; i < blockCount * 16; i += 16) {
    encryptBlock(rgbaPixels, i, out, i, expKey);
  }

  // Jika ada sisa byte yang kurang dari 16 byte
  const remainder = total % 16;
  if (remainder > 0) {
    const pad = new Uint8Array(16);
    pad.set(rgbaPixels.subarray(blockCount * 16));
    const padOut = new Uint8Array(16);
    encryptBlock(pad, 0, padOut, 0, expKey);
    out.set(padOut.subarray(0, remainder), blockCount * 16);
  }

  // Atur channel Alpha (byte ke-4 pada setiap piksel) ke 255 agar gambar tetap solid dan jelas terlihat polanya
  for (let i = 3; i < total; i += 4) {
    out[i] = 255;
  }

  return out;
}

/**
 * Enkripsi piksel RGBA menggunakan Mode Aman (CBC dengan IV acak / Nonce)
 * Setiap blok di-XOR dengan ciphertext blok sebelumnya sebelum dienkripsi.
 * Menghasilkan noise acak murni tanpa pola visual sama sekali.
 */
export function encryptPixelsSecure(
  rgbaPixels: Uint8ClampedArray,
  key: Uint8Array = new Uint8Array([0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c]),
  customIv?: Uint8Array
): Uint8ClampedArray {
  const expKey = expandKey(key);
  const total = rgbaPixels.length;
  const out = new Uint8ClampedArray(total);

  // Buat IV acak 16 byte
  let iv = customIv;
  if (!iv) {
    iv = new Uint8Array(16);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(iv);
    } else {
      for (let k = 0; k < 16; k++) iv[k] = Math.floor(Math.random() * 256);
    }
  }

  let prevBlock: Uint8Array | Uint8ClampedArray = iv;
  const tempBlock = new Uint8Array(16);
  const blockCount = Math.floor(total / 16);

  for (let i = 0; i < blockCount * 16; i += 16) {
    for (let j = 0; j < 16; j++) {
      tempBlock[j] = rgbaPixels[i + j] ^ prevBlock[j];
    }
    encryptBlock(tempBlock, 0, out, i, expKey);
    prevBlock = out.subarray(i, i + 16);
  }

  const remainder = total % 16;
  if (remainder > 0) {
    const pad = new Uint8Array(16);
    pad.set(rgbaPixels.subarray(blockCount * 16));
    for (let j = 0; j < 16; j++) {
      pad[j] ^= prevBlock[j];
    }
    const padOut = new Uint8Array(16);
    encryptBlock(pad, 0, padOut, 0, expKey);
    out.set(padOut.subarray(0, remainder), blockCount * 16);
  }

  // Atur channel Alpha ke 255 agar visual noise acak tetap buram / tidak transparan
  for (let i = 3; i < total; i += 4) {
    out[i] = 255;
  }

  return out;
}
