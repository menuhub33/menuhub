import { AuthFrame } from "@/modules/auth/components/auth-frame";
import { RegisterForm } from "@/modules/auth/components/register-form";

export default function RegisterPage() {
  return (
    <AuthFrame title="إنشاء حساب">
      <RegisterForm />
    </AuthFrame>
  );
}
