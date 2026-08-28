"use client";

import type { ReactElement } from "react";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import SvgIcon from "@mui/material/SvgIcon";

function OutlineIcon({ children, sx, ...props }: SvgIconProps) {
  return (
    <SvgIcon
      viewBox="0 0 24 24"
      {...props}
      sx={{
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.75,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...sx,
      }}
    >
      {children}
    </SvgIcon>
  );
}

function InstagramIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" />
    </OutlineIcon>
  );
}

function FacebookIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <path d="M17 3h-3a4 4 0 0 0-4 4v3H7v3h3v8h3v-8h3l1-3h-4V7a1 1 0 0 1 1-1h3V3Z" />
    </OutlineIcon>
  );
}

function TikTokIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <path d="M14 4v9.2a3.3 3.3 0 1 1-2.8-3.26V8.1A6.6 6.6 0 0 0 18 9.4V6.6A6 6 0 0 1 14 4Z" />
    </OutlineIcon>
  );
}

function XIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <path d="M5 5 19 19" />
      <path d="M19 5 5 19" />
    </OutlineIcon>
  );
}

function YouTubeIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="M10 9.8v4.4l4.2-2.2L10 9.8Z" />
    </OutlineIcon>
  );
}

function SnapchatIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <path d="M12 3.5c2.6 0 4.7 2.2 4.7 5.1 0 1.9.3 3.1 1.2 3.5.7.3 1.2 1.1.5 1.7-.6.5-1.6.4-2.2 1-.5.6-1.1.9-1.8.9-.6 0-1-.2-1.4-.4-.4-.2-.7-.3-1-.3s-.6.1-1 .3c-.4.2-.8.4-1.4.4-.7 0-1.3-.3-1.8-.9-.6-.6-1.6-.5-2.2-1-.7-.6-.2-1.4.5-1.7.9-.4 1.2-1.6 1.2-3.5 0-2.9 2.1-5.1 4.7-5.1Z" />
    </OutlineIcon>
  );
}

function LanguageIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </OutlineIcon>
  );
}

function WhatsAppIcon(props: SvgIconProps) {
  return (
    <OutlineIcon {...props}>
      <path d="M20 11.6A8 8 0 0 1 8.4 19L4 20l1.1-4.3A8 8 0 1 1 20 11.6Z" />
      <path d="M9 9.6c.3 2.2 2.2 4.2 3.8 4.8.6.2 1.1 0 1.5-.4l.6-.7" />
    </OutlineIcon>
  );
}

const ICONS: Record<string, (props: SvgIconProps) => ReactElement> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  twitter: XIcon,
  youtube: YouTubeIcon,
  snapchat: SnapchatIcon,
  website: LanguageIcon,
  whatsapp: WhatsAppIcon,
};

export const SOCIAL_PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#111111",
  twitter: "#111111",
  youtube: "#FF0000",
  snapchat: "#c9b800",
  website: "var(--mh-primary, #0f766e)",
  whatsapp: "#25D366",
};

export function SocialPlatformIcon({
  platform,
  ...props
}: { platform: string } & SvgIconProps) {
  const Icon = ICONS[platform] ?? LanguageIcon;
  return <Icon {...props} />;
}
