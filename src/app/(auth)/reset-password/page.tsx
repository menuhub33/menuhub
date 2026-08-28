import { AuthFrame } from "@/components/auth/auth-frame";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthFrame title="تعيين كلمة مرور جديدة">
      <ResetPasswordForm />
    </AuthFrame>
  );
}
