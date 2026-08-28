"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCategory } from "@/actions/categories/createCategory";
import { updateCategory } from "@/actions/categories/updateCategory";
import { updateCategoryStatus } from "@/actions/categories/updateCategoryStatus";
import { deleteCategory } from "@/actions/categories/deleteCategory";
import { reorderCategories } from "@/actions/categories/reorderCategories";
import { uploadImageFile } from "@/lib/upload-client";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { CategoryList } from "@/components/categories/category-list";
import { CategorySortableList } from "@/components/categories/category-sortable-list";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { CategoryFormValues } from "@/components/categories/category-form";
import type { Category } from "@/lib/types";

export function CategoriesView({
  menuId,
  categories,
  canEdit,
  canDelete,
}: {
  menuId: string;
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(values: CategoryFormValues) {
    setLoading(true);
    setError(null);
    const result = editing
      ? await updateCategory({
          id: editing.id,
          name_ar: values.name_ar,
          name_en: values.name_en || null,
          description_ar: values.description_ar || null,
          description_en: values.description_en || null,
          image_url: values.image_url,
          sort_order: values.sort_order,
        })
      : await createCategory({
          menu_id: menuId,
          name_ar: values.name_ar,
          name_en: values.name_en || null,
          description_ar: values.description_ar || null,
          description_en: values.description_en || null,
          image_url: values.image_url,
          sort_order: values.sort_order,
        });
    if (!result.error && editing && values.is_active !== editing.is_active) {
      await updateCategoryStatus(editing.id, values.is_active);
    }
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast({
      title: editing ? "تم تحديث القسم" : "تم إضافة القسم بنجاح",
      variant: "success",
    });
    setOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الأقسام"
        description="أنشئ أقسام المنيو وأعد ترتيبها بالسحب."
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "المنيو", href: "/dashboard/menu" },
          { label: "الأقسام" },
        ]}
      />
      <CategoryList
        categories={categories}
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={() => {
          setEditing(null);
          setOpen(true);
        }}
        onEdit={(category) => {
          setEditing(category);
          setOpen(true);
        }}
        onDelete={setDeleting}
      />
      {canEdit && categories.length > 1 ? (
        <CategorySortableList
          categories={categories}
          onReorder={async (ids) => {
            const result = await reorderCategories(ids);
            if (result.error) toast({ title: result.error, variant: "error" });
            else router.refresh();
          }}
        />
      ) : null}
      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        category={editing}
        loading={loading}
        error={error}
        onSubmit={save}
        onUpload={async (file) => {
          const uploaded = await uploadImageFile(file, "categories");
          if (uploaded.error || !uploaded.data) throw new Error(uploaded.error ?? "رفع فشل");
          return uploaded.data.url;
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => {
          if (!value) setDeleting(null);
        }}
        title="حذف القسم؟"
        description="سيتم حذف القسم وكل منتجاته."
        confirmLabel="حذف"
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteCategory(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم حذف القسم", variant: "success" });
            setDeleting(null);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
