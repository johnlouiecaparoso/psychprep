import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

const manrope = Manrope({
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Psychology Board Review Platform`,
  description: "Modern board exam review platform for psychology students, instructors, and admins."
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.className}>{children}</body>
    </html>
  );
}
