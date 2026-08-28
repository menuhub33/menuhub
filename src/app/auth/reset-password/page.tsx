import { redirect } from "next/navigation";

export default function AuthResetAlias() {
  redirect("/reset-password");
}
