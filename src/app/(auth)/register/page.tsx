import { AuthFrame } from "@/components/auth/auth-frame";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFrame title="إنشاء حساب">
      <RegisterForm />
    </AuthFrame>
  );
}
