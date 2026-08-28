import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const expoArabic = localFont({
  src: "../../public/alfont_com_AlFont_com_ExpoArabic-Book-1.ttf",
  variable: "--font-expo-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MenuHub — منيو إلكترونية للمطاعم",
    template: "%s | MenuHub",
  },
  description: "أنشئ منيو مطعمك الإلكترونية خلال دقائق مع رابط خاص ورمز QR ولوحة تحكم سهلة.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${expoArabic.variable} ${expoArabic.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
