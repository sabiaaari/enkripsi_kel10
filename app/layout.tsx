import './globals.css';

export const metadata = {
  title: 'MOYA - a little space for your thoughts',
  description: 'Ruang kecil untuk catatan harian, pikiran, dan agenda pribadi kamu.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-[#F9F3EA] text-[#4A3525] antialiased">
        {children}
      </body>
    </html>
  );
}