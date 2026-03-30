import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { A11yerWrapper } from "./a11yer-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "a11yer — Automatic Accessibility for React",
  description:
    "Wrap your React app in <A11yer> and accessibility is automatically handled.",
};

// This is a Server Component — SSR content is rendered here.
// A11yerWrapper is a Client Component that wraps children with <A11yer>.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <A11yerWrapper>{children}</A11yerWrapper>
      </body>
    </html>
  );
}
