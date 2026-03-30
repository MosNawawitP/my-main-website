import type { Metadata } from "next";
import { Anta, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anta = Anta({
  variable: "--font-anta",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nawawit Pilanthanayothin",
  description: "Nawawit Pilanthanayothin — Since 1996",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
