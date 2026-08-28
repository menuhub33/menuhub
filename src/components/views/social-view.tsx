"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSocialLink } from "@/actions/social-links/createSocialLink";
import { updateSocialLink } from "@/actions/social-links/updateSocialLink";
import { updateSocialLinkStatus } from "@/actions/social-links/updateSocialLinkStatus";
import { RestaurantPageShell } from "@/components/views/restaurant-settings-form";
import { SOCIAL_PLATFORMS } from "@/components/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { SocialPlatformIcon } from "@/components/ui/social-platform-icon";
import { socialInputDisplay, socialInputPlaceholder } from "@/lib/social";
import type { SocialLink } from "@/lib/types";

function platformLabel(platform: string): string {
  return SOCIAL_PLATFORMS.find((item) => item.value === platform)?.label ?? platform;
}

export function SocialView({
  restaurantId,
  links,
}: {
  restaurantId: string;
  links: SocialLink[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [platform, setPlatform] = useState("whatsapp");
  const [url, setUrl] = useState("");
  const isWhatsApp = platform === "whatsapp";

  return (
    <RestaurantPageShell title="روابط التواصل">
      <form
        className="grid gap-3 sm:grid-cols-[14rem_1fr_auto]"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await createSocialLink({ restaurant_id: restaurantId, platform, url });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setUrl("");
            toast({
              title: isWhatsApp ? "تم إضافة رقم واتساب" : "تم إضافة الرابط",
              variant: "success",
            });
            router.refresh();
          }
        }}
      >
        <Select
          value={platform}
          onChange={(value) => {
            setPlatform(value);
            setUrl("");
          }}
          options={SOCIAL_PLATFORMS.map((item) => ({
            value: item.value,
            label: item.label,
            icon: <SocialPlatformIcon platform={item.value} size={20} />,
          }))}
        />
        <Input
          dir="ltr"
          inputMode={isWhatsApp ? "tel" : "url"}
          placeholder={socialInputPlaceholder(platform)}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <Button type="submit">إضافة</Button>
      </form>
      <p className="mt-2 text-xs text-zinc-500">
        {isWhatsApp
          ? "أدخل رقم واتساب (مثل 09xxxxxxxx). تظهر أيقونة واتساب المفرّغة في المنيو العام."
          : "ألصق رابط الصفحة. يظهر أيقونة المنصة في المنيو العام."}
      </p>
      <div className="mt-4 grid gap-2">
        {links.map((link) => (
          <div key={link.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
            <span className="flex min-w-28 items-center gap-2 text-sm font-medium">
              <SocialPlatformIcon platform={link.platform} size={22} />
              {platformLabel(link.platform)}
            </span>
            <Input
              className="flex-1"
              dir="ltr"
              inputMode={link.platform === "whatsapp" ? "tel" : "url"}
              placeholder={socialInputPlaceholder(link.platform)}
              defaultValue={socialInputDisplay(link.platform, link.url)}
              onBlur={async (event) => {
                const result = await updateSocialLink({
                  id: link.id,
                  restaurant_id: restaurantId,
                  platform: link.platform,
                  url: event.target.value,
                });
                if (result.error) toast({ title: result.error, variant: "error" });
                else router.refresh();
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await updateSocialLinkStatus(link.id, restaurantId, !link.is_active);
                router.refresh();
              }}
            >
              {link.is_active ? "إخفاء" : "إظهار"}
            </Button>
          </div>
        ))}
      </div>
    </RestaurantPageShell>
  );
}
