"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/core/ui/toast";
import { listOrders } from "@/modules/orders/actions/orders";

const POLL_MS = 8_000;

/** Short two-tone chime. Browsers may block audio before the first click: that is ignored. */
export function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tone = (frequency: number, start: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.32);
    };
    tone(880, 0);
    tone(1175, 0.18);
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    // no sound: the toast and the badge still show
  }
}

/**
 * Watches the QR-menu orders inbox while the screen is open.
 * - `pending`: how many customer orders wait for a decision (for the badge).
 * - `version`: changes whenever a new order arrives, so lists can reload themselves.
 * A toast and a chime fire for each new order after the first load.
 */
export function useIncomingOrders(enabled: boolean) {
  const { toast } = useToast();
  const [pending, setPending] = useState(0);
  const [version, setVersion] = useState(0);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    const check = () =>
      void listOrders("PENDING").then((result) => {
        if (!active || result.error || !result.data) return;
        const items = result.data.items;
        setPending(result.data.total ?? items.length);

        const known = seen.current;
        seen.current = new Set(items.map((order) => order.id));
        if (!known) return; // first load: just the baseline, no notification

        const fresh = items.filter((order) => !known.has(order.id));
        if (fresh.length === 0) return;

        setVersion((current) => current + 1);
        chime();
        toast({
          title: fresh.length === 1 ? "طلب جديد من الزبون" : `${fresh.length} طلبات جديدة من الزبائن`,
          description: fresh.length === 1 ? fresh[0].number : undefined,
          variant: "info",
          duration: 8000,
        });
      });

    check();
    const timer = window.setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, toast]);

  /** Local correction after confirm/reject so the badge drops immediately. */
  function adjust(delta: number) {
    setPending((current) => Math.max(0, current + delta));
  }

  return { pending, version, adjust };
}
