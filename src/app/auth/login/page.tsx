import { redirect } from "next/navigation";

export default async function AuthLoginAlias(props: PageProps<"/auth/login">) {
  const search = await props.searchParams;
  const next = typeof search.next === "string" ? `?next=${encodeURIComponent(search.next)}` : "";
  redirect(`/login${next}`);
}
