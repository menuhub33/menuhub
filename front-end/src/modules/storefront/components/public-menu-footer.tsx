import { cn } from "@/core/lib/cn";
import { DesignerCredit } from "@/core/components/layout/designer-credit";
import type { SocialLink } from "@/modules/operations/types";
import { SocialLinks } from "@/modules/storefront/components/social-links";

export function PublicMenuFooter({
  socialLinks,
  className,
}: {
  socialLinks?: SocialLink[];
  className?: string;
}) {
  const hasSocial = Boolean(socialLinks && socialLinks.some((link) => link.is_active));

  return (
    <footer
      className={cn(
        "border-t border-[var(--mh-text)]/10 px-0 py-8",
        className
      )}
    >
      <div className="grid gap-6">
        {hasSocial ? <SocialLinks links={socialLinks ?? []} /> : null}
        <DesignerCredit onMenu />
      </div>
    </footer>
  );
}
