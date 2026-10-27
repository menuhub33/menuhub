import { AuthFrame } from "@/modules/auth/components/auth-frame";
import { LoginForm } from "@/modules/auth/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthFrame title="تسجيل الدخول">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthFrame>
  );
}
