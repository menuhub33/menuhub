import Link from "next/link";

export function AuthFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-teal-800">
            MenuHub
          </Link>
          <h1 className="mt-4 text-xl font-bold text-zinc-900">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
