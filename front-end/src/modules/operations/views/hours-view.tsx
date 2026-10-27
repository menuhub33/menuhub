"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBusinessHours } from "@/modules/operations/actions/business-hours";
import { RestaurantPageShell } from "@/modules/tenancy/views/restaurant-settings-form";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Switch } from "@/core/ui/switch";
import { useToast } from "@/core/ui/toast";
import { DAY_NAMES_AR } from "@/core/lib/format";
import type { BusinessHours } from "@/modules/operations/types";

type DayState = {
  is_closed: boolean;
  open_time: string;
  close_time: string;
};

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "23:00";

function initialSchedule(hours: BusinessHours[]): DayState[] {
  return DAY_NAMES_AR.map((_, day) => {
    const current = hours.find((item) => item.day_of_week === day);
    return {
      is_closed: current?.is_closed ?? false,
      open_time: current?.open_time?.slice(0, 5) ?? DEFAULT_OPEN,
      close_time: current?.close_time?.slice(0, 5) ?? DEFAULT_CLOSE,
    };
  });
}

/** The API stores the whole week at once, so the view edits locally and saves once. */
export function HoursView({
  restaurantId,
  hours,
}: {
  restaurantId: string;
  hours: BusinessHours[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DayState[]>(() => initialSchedule(hours));

  function patchDay(day: number, patch: Partial<DayState>) {
    setSchedule((current) =>
      current.map((item, index) => (index === day ? { ...item, ...patch } : item))
    );
  }

  async function save() {
    setSaving(true);
    const result = await saveBusinessHours({
      restaurant_id: restaurantId,
      hours: schedule.map((day, index) => ({ day_of_week: index, ...day })),
    });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ ساعات العمل" });
    router.refresh();
  }

  return (
    <RestaurantPageShell title="ساعات العمل">
      <div className="grid gap-3">
        {DAY_NAMES_AR.map((name, day) => {
          const current = schedule[day];
          return (
            <div key={name} className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="w-24 font-medium">{name}</p>
              <Switch
                checked={!current.is_closed}
                label={current.is_closed ? "مغلق" : "مفتوح"}
                onCheckedChange={(checked) => patchDay(day, { is_closed: !checked })}
              />
              <Input
                type="time"
                className="w-32"
                value={current.open_time}
                disabled={current.is_closed}
                onChange={(event) => patchDay(day, { open_time: event.target.value })}
              />
              <Input
                type="time"
                className="w-32"
                value={current.close_time}
                disabled={current.is_closed}
                onChange={(event) => patchDay(day, { close_time: event.target.value })}
              />
            </div>
          );
        })}
        <Button loading={saving} onClick={() => void save()}>
          حفظ
        </Button>
      </div>
    </RestaurantPageShell>
  );
}
