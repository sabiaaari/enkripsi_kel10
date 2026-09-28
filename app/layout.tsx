import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { MasterPasswordProvider } from "@/context/MasterPasswordContext";
import MasterPasswordModal from "@/components/MasterPasswordModal";
import LayoutContent from "@/components/LayoutContent";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "MOYA — Make Own Yarns",
  description: "A calm, simple space for your notes, files and private thoughts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="font-body">
        <MasterPasswordProvider>
          <LayoutContent>{children}</LayoutContent>
          <MasterPasswordModal />
        </MasterPasswordProvider>
      </body>
    </html>
  );
}
