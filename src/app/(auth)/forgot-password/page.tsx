import { AuthFrame } from "@/components/auth/auth-frame";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthFrame title="استعادة كلمة المرور">
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
