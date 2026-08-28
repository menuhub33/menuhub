"use client";

import { useMemo, useState } from "react";
import { dayNameAr, formatTime } from "@/components/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { BusinessHours } from "@/lib/types";

type HourDraft = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

function toDraft(hours?: BusinessHours[]): HourDraft[] {
  return Array.from({ length: 7 }, (_, day) => {
    const existing = hours?.find((item) => item.day_of_week === day);
    return {
      day_of_week: day,
      open_time: existing?.open_time?.slice(0, 5) ?? "09:00",
      close_time: existing?.close_time?.slice(0, 5) ?? "23:00",
      is_closed: existing?.is_closed ?? false,
    };
  });
}

export function RestaurantHours({
  hours,
  readOnly,
  onChange,
}: {
  hours?: BusinessHours[];
  readOnly?: boolean;
  onChange?: (hours: HourDraft[]) => void;
}) {
  const initial = useMemo(() => toDraft(hours), [hours]);
  const [draft, setDraft] = useState(initial);

  if (readOnly) {
    return (
      <ul className="space-y-2 text-sm">
        {toDraft(hours).map((item) => (
          <li key={item.day_of_week} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
            <span className="font-medium">{dayNameAr(item.day_of_week)}</span>
            <span className="text-zinc-500">
              {item.is_closed ? "مغلق" : `${formatTime(item.open_time)} — ${formatTime(item.close_time)}`}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  function update(day: number, patch: Partial<HourDraft>) {
    setDraft((current) => current.map((item) => (item.day_of_week === day ? { ...item, ...patch } : item)));
  }

  return (
    <div className="grid gap-3">
      {draft.map((item) => (
        <div key={item.day_of_week} className="grid items-center gap-2 rounded-xl border border-zinc-200 p-3 sm:grid-cols-[7rem_1fr_auto]">
          <p className="text-sm font-medium">{dayNameAr(item.day_of_week)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="time"
              disabled={item.is_closed}
              value={item.open_time}
              onChange={(event) => update(item.day_of_week, { open_time: event.target.value })}
              className="h-10 w-32"
            />
            <span className="text-zinc-400">إلى</span>
            <Input
              type="time"
              disabled={item.is_closed}
              value={item.close_time}
              onChange={(event) => update(item.day_of_week, { close_time: event.target.value })}
              className="h-10 w-32"
            />
          </div>
          <Checkbox
            label="مغلق"
            checked={item.is_closed}
            onChange={(event) => update(item.day_of_week, { is_closed: event.target.checked })}
          />
        </div>
      ))}
      {onChange ? (
        <div className="flex justify-end">
          <Button onClick={() => onChange(draft)}>حفظ الأوقات</Button>
        </div>
      ) : null}
    </div>
  );
}
