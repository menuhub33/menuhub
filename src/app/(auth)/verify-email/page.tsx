import Link from "next/link";
import { AuthFrame } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <AuthFrame title="تأكيد البريد الإلكتروني">
      <p className="mb-6 text-center text-sm leading-6 text-zinc-600">
        أرسلنا رسالة إلى بريدك لتأكيد الحساب. بعد التأكيد يمكنك تسجيل الدخول وإكمال إعداد مطعمك.
      </p>
      <Link href="/login">
        <Button className="w-full">العودة لتسجيل الدخول</Button>
      </Link>
    </AuthFrame>
  );
}
