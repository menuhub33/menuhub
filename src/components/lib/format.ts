const CURRENCY_AR: Record<string, string> = {
  SYP: "ل.س",
  USD: "دولار",
  EUR: "يورو",
  SAR: "ر.س",
  AED: "د.إ",
  TRY: "₺",
};

const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export function currencyLabel(currency: string): string {
  return CURRENCY_AR[currency] ?? currency;
}

export function formatPrice(price: number, currency = "SYP"): string {
  const formatted = new Intl.NumberFormat("ar-SY-u-nu-latn", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);

  return `${formatted} ${currencyLabel(currency)}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), "day");
  return formatDate(iso);
}

export function dayNameAr(dayOfWeek: number): string {
  return DAY_NAMES_AR[dayOfWeek] ?? `اليوم ${dayOfWeek}`;
}

export function formatTime(time: string | null): string {
  if (!time) return "—";
  const [h, m] = time.split(":");
  if (h == null || m == null) return time;
  return `${h}:${m}`;
}

export { DAY_NAMES_AR };
