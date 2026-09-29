const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Memberi tahu Next.js letak folder utama aplikasi
  dir: './',
});

// Konfigurasi khusus Jest
const customJestConfig = {
  // Menggunakan lingkungan node karena kita menguji fungsi logika murni
  testEnvironment: 'node',
};

// Mengekspor konfigurasi agar digunakan oleh Jest
module.exports = createJestConfig(customJestConfig);