import { redirect } from "next/navigation";

export default function AuthVerifyAlias() {
  redirect("/verify-email");
}
