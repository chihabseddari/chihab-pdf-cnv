import type { Metadata } from "next";
import { Amiri, Fraunces, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Atmosphere } from "@/components/atmosphere";
import "./globals.css";

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap",
});

const fraunces = Fraunces({
  weight: ["500", "600"],
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const plex = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "chihab pdf cnv",
    template: "%s | chihab pdf cnv",
  },
  description:
    "حساب خاص لكل شخص، تحويل الصور إلى PDF، دمج الملفات وتقسيمها، وفحص صورة تذكرة اليانصيب على النتائج المنشورة.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${fraunces.variable} ${plex.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <Atmosphere />
        <div className="relative z-10 min-h-full">{children}</div>
      </body>
    </html>
  );
}
