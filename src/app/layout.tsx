import type { Metadata } from "next";
import { Bungee } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const bungee = Bungee({
  weight: "400",
  variable: "--font-bungee",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Finance Dashboard",
  description: "AI-Powered Personal Finance Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${bungee.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
