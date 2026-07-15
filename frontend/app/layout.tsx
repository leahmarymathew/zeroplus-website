import type { Metadata } from "next";
import { Poppins, Nunito } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Zeroplus — Everything your little one needs",
    template: "%s | Zeroplus",
  },
  description:
    "Diapers, feeding, clothing & more — 100% genuine baby products, delivered with care from Zeroplus, Kothamangalam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
