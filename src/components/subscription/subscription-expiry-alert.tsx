import { Alert } from "@/components/ui/alert";
import { SUBSCRIPTION_STATUS_LABELS } from "@/components/lib/labels";
import { formatDate } from "@/components/lib/format";
import type { Subscription } from "@/lib/types";

const MS_PER_DAY = 86_400_000;

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / MS_PER_DAY);
}

function nearestExpiry(subscription: Subscription): { at: string; kind: "trial" | "period" } | null {
  const trial = subscription.trial_ends_at;
  const end = subscription.ends_at;
  if (trial && end) {
    return new Date(trial).getTime() <= new Date(end).getTime()
      ? { at: trial, kind: "trial" }
      : { at: end, kind: "period" };
  }
  if (trial) return { at: trial, kind: "trial" };
  if (end) return { at: end, kind: "period" };
  return null;
}

export function SubscriptionExpiryAlert({
  subscription,
  daysBefore = 7,
}: {
  subscription: Subscription;
  daysBefore?: number;
}) {
  if (subscription.status === "EXPIRED") {
    return (
      <Alert variant="error" title="انتهى الاشتراك">
        لم يعد الاشتراك فعالًا. جدّد الخطة لاستعادة النشر والنطاقات والميزات المدفوعة.
      </Alert>
    );
  }

  if (subscription.status === "PAST_DUE") {
    return (
      <Alert variant="error" title="تأخر سداد الاشتراك">
        توجد دفعة مستحقة. أكمل السداد قبل تعليق الميزات.
      </Alert>
    );
  }

  if (subscription.status === "CANCELLED") {
    const end = subscription.ends_at;
    return (
      <Alert variant="warning" title="الاشتراك ملغى">
        {end
          ? `ستبقى الميزات متاحة حتى ${formatDate(end)} ما لم يُجدَّد الاشتراك.`
          : "تم إلغاء التجديد التلقائي. لن تُجدَّد الخطة في الدورة القادمة."}
      </Alert>
    );
  }

  const expiry = nearestExpiry(subscription);
  if (!expiry) return null;

  const remaining = daysUntil(expiry.at);
  if (remaining > daysBefore) return null;

  if (remaining < 0) {
    return (
      <Alert variant="error" title={expiry.kind === "trial" ? "انتهت الفترة التجريبية" : "انتهت صلاحية الاشتراك"}>
        تاريخ الانتهاء: {formatDate(expiry.at)}. جدّد الخطة للمتابعة دون انقطاع.
      </Alert>
    );
  }

  const label = expiry.kind === "trial" ? "الفترة التجريبية" : "الاشتراك";
  const title =
    remaining === 0 ? `${label} ينتهي اليوم` : `${label} ينتهي خلال ${remaining} يومًا`;

  return (
    <Alert variant="warning" title={title}>
      الحالة الحالية: {SUBSCRIPTION_STATUS_LABELS[subscription.status]}. تاريخ الانتهاء{" "}
      {formatDate(expiry.at)}. جدّد أو غيّر الخطة قبل انقطاع الخدمة.
    </Alert>
  );
}
