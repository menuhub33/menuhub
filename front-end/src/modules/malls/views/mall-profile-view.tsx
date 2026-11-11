"use client";

import { useState } from "react";
import { reloadPage } from "@/core/lib/reload";
import { PageHeader } from "@/core/components/layout/page-header";
import { FormField } from "@/core/components/forms/form-field";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Select } from "@/core/ui/select";
import { useToast } from "@/core/ui/toast";
import { updateMyMall } from "@/modules/malls/actions/malls";
import type { Mall, MallStatus } from "@/modules/malls/types";

export function MallProfileView({ mall }: { mall: Mall }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<MallStatus>(mall.status);
  const [name, setName] = useState(mall.name);
  const [slug, setSlug] = useState(mall.slug);

  async function save() {
    setSaving(true);
    const result = await updateMyMall({ name, slug, status });
    setSaving(false);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({ title: "تم حفظ بطاقة المول", variant: "success" });
    reloadPage();
  }

  return (
    <div className="grid max-w-xl gap-4">
      <PageHeader
        title="بطاقة المول"
        actions={
          <Button variant="outline" onClick={() => window.open(`/c/${slug}`, "_blank")}>
            عرض الدليل
          </Button>
        }
      />
      <FormField label="حالة الدليل" htmlFor="my-mall-status">
        <Select
          id="my-mall-status"
          value={status}
          onChange={(value) => setStatus(value as MallStatus)}
          options={[
            { value: "UNPUBLISHED", label: "غير منشور" },
            { value: "PUBLISHED", label: "منشور" },
          ]}
        />
      </FormField>
      <FormField label="الاسم" htmlFor="my-mall-name" required>
        <Input id="my-mall-name" value={name} onChange={(event) => setName(event.target.value)} />
      </FormField>
      <FormField label="الرابط" htmlFor="my-mall-slug" required hint="يظهر للزائر على /c/الرابط">
        <Input id="my-mall-slug" dir="ltr" value={slug} onChange={(event) => setSlug(event.target.value)} />
      </FormField>
      <Button loading={saving} onClick={() => void save()} className="w-fit">
        حفظ
      </Button>
    </div>
  );
}
