import Link from "next/link";
import { BrandMark } from "@/core/components/layout/brand-mark";

const CONTACT_HREF = "https://wa.me/963982941883";

function ContactButton({ className }: { className: string }) {
  return (
    <a
      href={CONTACT_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      تواصل معنا
    </a>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <BrandMark href="/" compact className="w-12" imageClassName="size-12" />
        <ContactButton className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800" />
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-8 px-4 py-16">
        <p className="rounded-full bg-gold-100 px-3 py-1 text-sm font-medium text-gold-800">
          منصة المنيو الإلكترونية للمطاعم
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-zinc-900 sm:text-5xl">
          حوّل منيو مطعمك الورقية إلى تجربة رقمية أنيقة خلال دقائق
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          تتولى الإدارة إنشاء موقع مطعمك وتفعيله. بعد التفعيل تحصل على رابط خاص على نطاقك ولوحة
          تحكم لإدارة المنيو ورمز QR.
        </p>
        <div className="flex flex-wrap gap-3">
          <ContactButton className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-700 px-5 text-base font-medium text-white hover:bg-teal-800" />
          <Link
            href="/m/demo"
            className="inline-flex h-12 items-center rounded-xl border border-teal-200 bg-teal-50 px-5 text-base font-medium text-teal-800 hover:bg-teal-100"
          >
            منيو مطعم تجريبي
          </Link>
          <Link
            href="/m/demo-cars"
            className="inline-flex h-12 items-center rounded-xl border border-slate-300 bg-slate-50 px-5 text-base font-medium text-slate-800 hover:bg-slate-100"
          >
            معرض سيارات تجريبي
          </Link>
        </div>
        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          {[
            { title: "رابط مستقل", text: "كل مطعم يحصل على رابط خاص ومنيو سريعة للموبايل." },
            { title: "إدارة لحظية", text: "حدّث الأسعار والتوفر فوراً من لوحة التحكم." },
            { title: "QR جاهز", text: "حمّل الرمز واطبعه على الطاولات خلال ثوانٍ." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-zinc-200 p-5">
              <h2 className="font-semibold text-zinc-900">{item.title}</h2>
              <p className="mt-2 text-sm text-zinc-500">{item.text}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="border-t border-zinc-100 px-4 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} MenuHub
      </footer>
    </div>
  );
}
