"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBusinessHours } from "@/actions/business-hours/createBusinessHours";
import { updateBusinessHours } from "@/actions/business-hours/updateBusinessHours";
import { RestaurantPageShell } from "@/components/views/restaurant-settings-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { DAY_NAMES_AR } from "@/components/lib/format";
import type { BusinessHours } from "@/lib/types";

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

  async function saveDay(day: number, patch: Partial<BusinessHours> & { open_time?: string | null; close_time?: string | null; is_closed?: boolean }) {
    setSaving(true);
    const current = hours.find((item) => item.day_of_week === day);
    const result = current
      ? await updateBusinessHours({ id: current.id, restaurant_id: restaurantId, ...patch })
      : await createBusinessHours({ restaurant_id: restaurantId, day_of_week: day, ...patch });
    setSaving(false);
    if (result.error) toast({ title: result.error, variant: "error" });
    else router.refresh();
  }

  return (
    <RestaurantPageShell title="ساعات العمل">
      <div className="grid gap-3">
        {DAY_NAMES_AR.map((name, day) => {
          const current = hours.find((item) => item.day_of_week === day);
          return (
            <div key={name} className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="w-24 font-medium">{name}</p>
              <Switch
                checked={!current?.is_closed}
                label={current?.is_closed ? "مغلق" : "مفتوح"}
                onCheckedChange={(checked) => void saveDay(day, { is_closed: !checked })}
              />
              <Input
                type="time"
                className="w-32"
                value={current?.open_time?.slice(0, 5) ?? "09:00"}
                disabled={current?.is_closed}
                onBlur={(event) => void saveDay(day, { open_time: event.target.value })}
              />
              <Input
                type="time"
                className="w-32"
                value={current?.close_time?.slice(0, 5) ?? "23:00"}
                disabled={current?.is_closed}
                onBlur={(event) => void saveDay(day, { close_time: event.target.value })}
              />
            </div>
          );
        })}
        <Button disabled={saving} onClick={() => router.refresh()}>تحديث</Button>
      </div>
    </RestaurantPageShell>
  );
}
