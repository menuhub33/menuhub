"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { MenuChatMessage, MenuChatReply } from "@/modules/chatbot/lib/menu-chat";

export type AskMenuChatInput = {
  slug: string;
  messages: MenuChatMessage[];
};

export async function askMenuChat(
  input: AskMenuChatInput
): Promise<ActionResult<MenuChatReply>> {
  const slug = input.slug?.trim().toLowerCase();
  if (!slug) return fail("المعرّف مطلوب");

  const messages = input.messages
    .filter((message) => message.content?.trim())
    .map((message) => ({ role: message.role, content: message.content.trim() }));
  if (!messages.some((message) => message.role === "user")) {
    return fail("اكتب سؤالك أولاً");
  }

  return run(() =>
    apiData<MenuChatReply>(`/public/menus/${encodeURIComponent(slug)}/chat`, {
      method: "POST",
      auth: false,
      body: { messages },
    })
  );
}
