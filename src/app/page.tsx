import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-xl font-bold text-teal-800">
          MenuHub
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800"
          >
            تسجيل حساب
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-8 px-4 py-16">
        <p className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
          منصة المنيو الإلكترونية للمطاعم
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-zinc-900 sm:text-5xl">
          حوّل منيو مطعمك الورقية إلى تجربة رقمية أنيقة خلال دقائق
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          سجّل حسابك، ثم تتولى الإدارة إنشاء موقع مطعمك وتفعيله. بعد التفعيل تحصل على رابط خاص
          مثل burgerhouse.menuhub.com ولوحة تحكم لإدارة المنيو ورمز QR.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex h-12 items-center rounded-xl bg-teal-700 px-5 text-base font-medium text-white hover:bg-teal-800"
          >
            تسجيل حساب
          </Link>
          <Link
            href="/m/demo"
            className="inline-flex h-12 items-center rounded-xl border border-teal-200 bg-teal-50 px-5 text-base font-medium text-teal-800 hover:bg-teal-100"
          >
            شاهد منيو تجريبي
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-xl border border-zinc-200 bg-white px-5 text-base font-medium text-zinc-800 hover:bg-zinc-50"
          >
            لدي حساب
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
