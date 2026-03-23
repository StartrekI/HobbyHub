import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HobbyHub - Real-time Local Activities",
  description: "Discover nearby activities, meet people with similar hobbies, and join spontaneous plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="h-full font-[family-name:var(--font-geist-sans)] bg-gray-50 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
