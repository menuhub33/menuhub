"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOptionGroup } from "@/modules/catalog/actions/options";
import { updateOptionGroup } from "@/modules/catalog/actions/options";
import { deleteOptionGroup } from "@/modules/catalog/actions/options";
import { createProductOption } from "@/modules/catalog/actions/options";
import { updateProductOption } from "@/modules/catalog/actions/options";
import { updateProductOptionStatus } from "@/modules/catalog/actions/options";
import { PageHeader } from "@/core/components/layout/page-header";
import { OptionGroupList } from "@/modules/catalog/components/options/option-group-list";
import { OptionDialog } from "@/modules/catalog/components/options/option-dialog";
import { Select } from "@/core/ui/select";
import { ConfirmDialog } from "@/core/ui/confirm-dialog";
import { useToast } from "@/core/ui/toast";
import type { OptionGroupWithOptions, ProductWithRelations } from "@/modules/catalog/types";
import type { ProductOption } from "@/modules/catalog/types";

type GroupWithProduct = OptionGroupWithOptions & { product: ProductWithRelations };

export function OptionsView({
  groups,
  products,
  canEdit,
}: {
  groups: GroupWithProduct[];
  products: ProductWithRelations[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [groupOpen, setGroupOpen] = useState(false);
  const [optionOpen, setOptionOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<OptionGroupWithOptions | null>(null);
  const [activeOption, setActiveOption] = useState<ProductOption | null>(null);
  const [deleting, setDeleting] = useState<OptionGroupWithOptions | null>(null);

  const visible = useMemo(
    () => groups.filter((group) => group.product_id === productId),
    [groups, productId]
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الخيارات والإضافات"
        description="مثل الحجم والإضافات مع فروقات السعر."
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "المنيو", href: "/dashboard/menu" },
          { label: "الإضافات" },
        ]}
      />
      <Select
        value={productId}
        onChange={setProductId}
        placeholder="اختر منتجاً"
        options={products.map((product) => ({ value: product.id, label: product.name_ar }))}
      />
      <OptionGroupList
        groups={visible}
        canEdit={canEdit}
        canDelete={canEdit}
        onAdd={() => {
          setActiveGroup(null);
          setGroupOpen(true);
        }}
        onEdit={(group) => {
          setActiveGroup(group);
          setGroupOpen(true);
        }}
        onDelete={setDeleting}
        onAddOption={(group) => {
          setActiveGroup(group);
          setActiveOption(null);
          setOptionOpen(true);
        }}
        onEditOption={(option, group) => {
          setActiveGroup(group);
          setActiveOption(option);
          setOptionOpen(true);
        }}
        onDeleteOption={async (option, group) => {
          await updateProductOptionStatus(option.id, group.id, false);
          router.refresh();
        }}
      />
      <OptionDialog
        mode="group"
        open={groupOpen}
        onOpenChange={setGroupOpen}
        group={activeGroup}
        onSubmit={async (values) => {
          const result = activeGroup
            ? await updateOptionGroup({ id: activeGroup.id, ...values, name_en: values.name_en || null })
            : await createOptionGroup({
                product_id: productId,
                name_ar: values.name_ar,
                name_en: values.name_en || null,
                selection_type: values.selection_type,
                is_required: values.is_required,
                min_selection: values.min_selection,
                max_selection: values.max_selection,
                sort_order: values.sort_order,
              });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم حفظ المجموعة", variant: "success" });
            setGroupOpen(false);
            router.refresh();
          }
        }}
      />
      <OptionDialog
        mode="option"
        open={optionOpen}
        onOpenChange={setOptionOpen}
        option={activeOption}
        onSubmit={async (values) => {
          if (!activeGroup) return;
          const result = activeOption
            ? await updateProductOption({
                id: activeOption.id,
                option_group_id: activeGroup.id,
                name_ar: values.name_ar,
                name_en: values.name_en || null,
                price_delta: values.price_delta,
                sort_order: values.sort_order,
              })
            : await createProductOption({
                option_group_id: activeGroup.id,
                name_ar: values.name_ar,
                name_en: values.name_en || null,
                price_delta: values.price_delta,
                sort_order: values.sort_order,
              });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم حفظ الخيار", variant: "success" });
            setOptionOpen(false);
            router.refresh();
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="حذف مجموعة الخيارات؟"
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteOptionGroup(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setDeleting(null);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
