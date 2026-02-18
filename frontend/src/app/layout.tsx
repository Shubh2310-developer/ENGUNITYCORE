import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";

export const metadata: Metadata = {
  title: "Engunity AI | Intelligent Restraint",
  description: "A tool for serious work. Focus entirely on your research, code, and analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#030712]">
      <body className="antialiased font-sans text-slate-200">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
