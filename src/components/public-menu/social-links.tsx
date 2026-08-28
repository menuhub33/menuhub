"use client";

import { cn } from "@/components/lib/cn";
import { SOCIAL_PLATFORMS } from "@/components/lib/labels";
import {
  SOCIAL_PLATFORM_COLORS,
  SocialPlatformIcon,
} from "@/components/ui/social-platform-icon";
import { socialHref } from "@/lib/social";
import type { SocialLink } from "@/lib/types";

function platformLabel(platform: string): string {
  const match = SOCIAL_PLATFORMS.find((item) => item.value === platform);
  return match?.label ?? platform;
}

export function SocialLinks({
  links,
  className,
  compact = false,
}: {
  links: SocialLink[];
  className?: string;
  compact?: boolean;
}) {
  const active = [...links]
    .filter((link) => link.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (active.length === 0) return null;

  return (
    <section className={cn(compact ? "flex justify-center" : "grid gap-3", className)}>
      {compact ? null : <h2 className="text-sm font-semibold">تابعنا</h2>}
      <ul className="flex flex-wrap justify-center gap-2.5">
        {active.map((link) => {
          const colors = SOCIAL_PLATFORM_COLORS[link.platform] ?? SOCIAL_PLATFORM_COLORS.website;
          const label = platformLabel(link.platform);
          return (
            <li key={link.id}>
              <a
                href={socialHref(link.platform, link.url)}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                aria-label={label}
                className="inline-flex size-11 items-center justify-center rounded-full border-2 bg-transparent transition hover:scale-105"
                style={{ borderColor: colors, color: colors }}
              >
                <SocialPlatformIcon platform={link.platform} sx={{ fontSize: 22 }} />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
