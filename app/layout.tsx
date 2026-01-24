import { type Metadata } from "next";

import { Roboto_Flex, Roboto_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const geistSans = Roboto_Flex({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-geist-imono",
});

export const metadata: Metadata = {
  title: "Product Requirements Copilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
