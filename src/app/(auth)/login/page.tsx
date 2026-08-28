import { AuthFrame } from "@/components/auth/auth-frame";
import { LoginForm } from "@/components/auth/login-form";
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
