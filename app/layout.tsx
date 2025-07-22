import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../components/LanguageContext";

export const metadata: Metadata = {
  title: "CDC Travel",
  description: "CDC Travel - Your trusted travel partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
