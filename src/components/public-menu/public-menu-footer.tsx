import { cn } from "@/components/lib/cn";
import type { SocialLink } from "@/lib/types";
import { SocialLinks } from "@/components/public-menu/social-links";

export function PublicMenuFooter({
  socialLinks,
  removeBranding = false,
  className,
}: {
  socialLinks?: SocialLink[];
  removeBranding?: boolean;
  className?: string;
}) {
  const hasSocial = Boolean(socialLinks && socialLinks.some((link) => link.is_active));

  if (!hasSocial && removeBranding) return null;

  return (
    <footer
      className={cn(
        "mt-10 border-t border-[var(--mh-text)]/10 px-0 py-8",
        className
      )}
    >
      <div className="grid gap-6">
        {removeBranding ? null : (
          <p className="text-center text-xs opacity-50">
            المنيو بواسطة{" "}
            <span className="font-semibold">MenuHub</span>
          </p>
        )}
        {hasSocial ? <SocialLinks links={socialLinks ?? []} /> : null}
      </div>
    </footer>
  );
}
