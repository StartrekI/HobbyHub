import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibe - Connect · Explore · Experience",
  description: "Discover nearby activities, meet people with similar hobbies, and join spontaneous plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="h-full font-sans bg-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
