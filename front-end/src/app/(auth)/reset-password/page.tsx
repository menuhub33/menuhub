import { Suspense } from "react";
import { AuthFrame } from "@/modules/auth/components/auth-frame";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthFrame title="تعيين كلمة مرور جديدة">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthFrame>
  );
}
