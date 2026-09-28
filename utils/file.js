/**
 * Mengonversi objek fail dari <input type="file"> menjadi Base64 string.
 * Menggunakan FileReader API dan mengembalikan Promise yang berisi teks Base64 string.
 * Format teks Base64 ini siap dienkripsi oleh modul utils/crypto.js sebelum dikirim ke Supabase.
 *
 * @param {File} file - Objek fail yang didapat dari event input file (e.target.files[0])
 * @returns {Promise<string>} Promise yang resolve ke teks Base64 string (Data URL)
 */
export function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Objek fail tidak valid atau kosong."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      // reader.result menghasilkan string teks Base64 (Data URL format: data:<mime>;base64,<data>)
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Gagal membaca berkas sebagai string Base64."));
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}
