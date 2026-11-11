import type { Metadata } from "next";
import localFont from "next/font/local";
import { SystemDesignerCredit } from "@/core/components/layout/system-designer-credit";
import { Providers } from "@/core/providers";
import { requestOrigin } from "@/core/lib/request-origin";
import "./globals.css";

const expoArabic = localFont({
  src: "../../public/alfont_com_AlFont_com_ExpoArabic-Book-1.ttf",
  variable: "--font-expo-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MenuHub — منيو للمراكز التجارية والمطاعم والكافيهات",
    template: "%s | MenuHub",
  },
  description: "أنشئ منيو إلكترونية لمركز تجاري أو مطعم أو كافيه خلال دقائق، مع رابط خاص ورمز QR ولوحة تحكم سهلة.",
  icons: {
    icon: "/menuhub-mark.png",
    apple: "/menuhub-mark.png",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const origin = await requestOrigin();
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${expoArabic.variable} ${expoArabic.className} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-background text-zinc-900">
        <Providers host={origin.host} protocol={origin.protocol}>
          <div className="flex flex-1 flex-col">{children}</div>
          <SystemDesignerCredit />
        </Providers>
      </body>
    </html>
  );
}
