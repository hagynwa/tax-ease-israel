import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "TaxEase | מס קל - החזרי מס ותיאום מס בקליק",
  description: "האפליקציה החכמה להחזרי מס ותיאום מס. קבלו את הכסף שמגיע לכם חזרה בקלות, במהירות ובאפס מאמץ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className={`${heebo.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
