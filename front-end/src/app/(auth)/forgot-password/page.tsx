import { AuthFrame } from "@/modules/auth/components/auth-frame";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthFrame title="استعادة كلمة المرور">
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
