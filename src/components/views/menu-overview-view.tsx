"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateMenuStatus } from "@/actions/menus/updateMenuStatus";
import { updateRestaurant } from "@/actions/restaurants/updateRestaurant";
import { PageHeader } from "@/components/layout/page-header";
import { MenuStatusCard } from "@/components/dashboard/menu-status-card";
import { MenuLinkCard } from "@/components/dashboard/menu-link-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PublishMenuDialog } from "@/components/menu/publish-menu-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { publicMenuUrl } from "@/lib/config";
import type { Menu, Restaurant } from "@/lib/types";

export function MenuOverviewView({
  restaurant,
  menu,
  categoryCount,
  productCount,
  canPublish,
}: {
  restaurant: Restaurant;
  menu: Menu | null;
  categoryCount: number;
  productCount: number;
  canPublish: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const url = publicMenuUrl(restaurant.slug);

  async function setStatus(status: "PUBLISHED" | "UNPUBLISHED") {
    if (!menu) return;
    const [menuResult, restaurantResult] = await Promise.all([
      updateMenuStatus(menu.id, restaurant.id, status),
      updateRestaurant({ id: restaurant.id, menu_status: status }),
    ]);
    if (menuResult.error || restaurantResult.error) {
      toast({ title: "تعذر تحديث حالة المنيو", variant: "error" });
      return;
    }
    toast({
      title: status === "PUBLISHED" ? "تم نشر المنيو بنجاح" : "تم إلغاء النشر",
      variant: "success",
    });
    setOpen(false);
    router.refresh();
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    toast({ title: "تم نسخ الرابط", variant: "success" });
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="المنيو"
        description="حالة المنيو والرابط العام وعدد الأقسام والمنتجات."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "المنيو" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.open(url, "_blank")}>
              معاينة
            </Button>
            <Button variant="outline" onClick={() => void copy()}>
              نسخ الرابط
            </Button>
            {canPublish && menu?.status !== "PUBLISHED" ? (
              <Button onClick={() => setOpen(true)}>نشر</Button>
            ) : null}
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="الأقسام" value={categoryCount} />
        <StatCard label="المنتجات" value={productCount} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MenuStatusCard
          restaurant={restaurant}
          menu={menu}
          canPublish={canPublish}
          onPublish={() => setOpen(true)}
          onUnpublish={() => void setStatus("UNPUBLISHED")}
        />
        <MenuLinkCard url={url} />
      </div>
      <PublishMenuDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => setStatus("PUBLISHED")}
      />
    </div>
  );
}
