"use client";

import {
  OptionGroupForm,
  type OptionGroupFormValues,
} from "@/components/options/option-group-form";
import { OptionForm, type OptionFormValues } from "@/components/options/option-form";
import { Dialog } from "@/components/ui/dialog";
import type { ProductOption, ProductOptionGroup } from "@/lib/types";

type OptionDialogBase = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  error?: string | null;
};

export type OptionDialogProps =
  | (OptionDialogBase & {
      mode: "group";
      group?: ProductOptionGroup | null;
      onSubmit: (values: OptionGroupFormValues) => void | Promise<void>;
    })
  | (OptionDialogBase & {
      mode: "option";
      option?: ProductOption | null;
      currency?: string;
      onSubmit: (values: OptionFormValues) => void | Promise<void>;
    });

export function OptionDialog(props: OptionDialogProps) {
  const isEdit = props.mode === "group" ? Boolean(props.group) : Boolean(props.option);
  const title =
    props.mode === "group"
      ? isEdit
        ? "تعديل مجموعة الخيارات"
        : "إضافة مجموعة خيارات"
      : isEdit
        ? "تعديل الخيار"
        : "إضافة خيار";
  const description =
    props.mode === "group"
      ? "حدد كيف يختار الزبون الإضافات أو الأحجام."
      : "أضف خيارًا مع فرق السعر إن وُجد.";

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={title}
      description={description}
      size="lg"
    >
      {props.mode === "group" ? (
        <OptionGroupForm
          key={props.group?.id ?? "new-group"}
          group={props.group}
          loading={props.loading}
          error={props.error}
          onSubmit={props.onSubmit}
          onCancel={() => props.onOpenChange(false)}
        />
      ) : (
        <OptionForm
          key={props.option?.id ?? "new-option"}
          option={props.option}
          currency={props.currency}
          loading={props.loading}
          error={props.error}
          onSubmit={props.onSubmit}
          onCancel={() => props.onOpenChange(false)}
        />
      )}
    </Dialog>
  );
}
