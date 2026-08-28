"use client";

import { useEffect, useRef, useState } from "react";
import { askMenuChat } from "@/actions/public/askMenuChat";
import { formatPrice } from "@/components/lib/format";
import { cn } from "@/components/lib/cn";
import { PublicSheet } from "@/components/public-menu/public-sheet";
import { BotIcon, PhoneIcon, SendIcon, UtensilsIcon, WhatsAppIcon } from "@/components/ui/icons";
import type { MenuChatContact, MenuChatProduct } from "@/lib/menu-chat";
import { whatsappHref } from "@/lib/phone";

type ChatBubble = {
  role: "user" | "assistant";
  content: string;
  products?: MenuChatProduct[];
  contact?: MenuChatContact | null;
  suggestions?: string[];
};

const SUGGESTIONS = ["ما هي الأقسام؟", "أرخص الأصناف", "هل التوصيل متاح؟", "كيف أطلب؟"];

export function PublicMenuChat({
  slug,
  name,
  welcome,
  onProductOpen,
}: {
  slug: string;
  name: string;
  welcome: string;
  onProductOpen?: (productId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([
    { role: "assistant", content: welcome, suggestions: SUGGESTIONS },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const history: ChatBubble[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const result = await askMenuChat({
        slug,
        messages: history.map((message) => ({ role: message.role, content: message.content })),
      });

      setLoading(false);
      if (result.error || !result.data) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: result.error ?? "تعذر الرد حالياً، حاول مرة أخرى." },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.data.reply,
          products: result.data.products,
          contact: result.data.contact,
          suggestions: result.data.suggestions,
        },
      ]);
    } catch {
      setLoading(false);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "تعذر الرد حالياً، حاول مرة أخرى." },
      ]);
    }

  }

  const last = messages[messages.length - 1];
  const chips =
    !loading && last?.role === "assistant" && last.suggestions && last.suggestions.length > 0
      ? last.suggestions
      : null;

  return (
    <>
      {open ? null : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={name}
          className="fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-[var(--mh-primary)] text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
        >
          <BotIcon className="size-7" />
        </button>
      )}

      <PublicSheet
        open={open}
        onOpenChange={setOpen}
        title={name}
        icon={BotIcon}
        size="md"
        className="h-[min(36rem,92vh)]"
        footer={
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="اسأل عن صنف، سعر، توصيل..."
              maxLength={500}
              disabled={loading}
              className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none focus:border-[var(--mh-primary)]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="إرسال"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--mh-primary)] text-white disabled:opacity-50"
            >
              <SendIcon className="size-4 rtl:-scale-x-100" />
            </button>
          </form>
        }
      >
        <div className="grid gap-3">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="grid gap-2">
              <div
                className={cn(
                  "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                  message.role === "user"
                    ? "ms-auto bg-[var(--mh-primary)] text-white"
                    : "me-auto bg-zinc-100 text-zinc-800"
                )}
              >
                {message.content}
              </div>
              {message.contact ? <ContactActions contact={message.contact} /> : null}
              {message.products && message.products.length > 0 ? (
                <div className="grid gap-2">
                  {message.products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onProductOpen?.(product.id);
                      }}
                      className="flex items-center gap-2 rounded-2xl border border-zinc-100 bg-white p-2 text-start shadow-sm"
                    >
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt=""
                          className="size-12 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--mh-primary)]/10 text-[var(--mh-primary)]">
                          <UtensilsIcon className="size-5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{product.name_ar}</span>
                        <span className="text-xs opacity-70">
                          {formatPrice(product.price, product.currency)}
                          {product.status === "UNAVAILABLE" ? " · غير متوفر" : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {loading ? (
            <div className="me-auto rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-sm text-zinc-500">
              يكتب...
            </div>
          ) : null}
          {chips ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </PublicSheet>
    </>
  );
}

function ContactActions({ contact }: { contact: MenuChatContact }) {
  const call = contact.phone || contact.display;
  const wa = contact.whatsapp || contact.phone || contact.display;
  return (
    <div className="flex flex-wrap gap-2">
      {call ? (
        <a
          href={`tel:${call}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--mh-primary)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          <PhoneIcon className="size-3.5" />
          اتصال {contact.display}
        </a>
      ) : null}
      {wa ? (
        <a
          href={whatsappHref(wa)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
        >
          <WhatsAppIcon className="size-3.5" />
          واتساب
        </a>
      ) : null}
    </div>
  );
}
