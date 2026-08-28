"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ConfirmAction({
  title,
  description,
  confirmLabel,
  variant = "danger",
  onConfirm,
  children,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  children: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      {children(() => setOpen(true))}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        variant={variant}
        loading={loading}
        onConfirm={async () => {
          setLoading(true);
          try {
            await onConfirm();
            setOpen(false);
          } finally {
            setLoading(false);
          }
        }}
      />
    </>
  );
}
