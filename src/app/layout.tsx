import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projektant rozdzielnicy DIN",
  description: "Edytor MVP do projektowania domowych rozdzielnic elektrycznych"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
