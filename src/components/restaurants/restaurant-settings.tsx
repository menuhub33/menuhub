"use client";

import { RestaurantForm, type RestaurantFormValues } from "@/components/restaurants/restaurant-form";
import { RestaurantHours } from "@/components/restaurants/restaurant-hours";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Button } from "@/components/ui/button";
import type { BusinessHours, Restaurant } from "@/lib/types";

export function RestaurantSettings({
  restaurant,
  hours,
  canDelete,
  loading,
  error,
  onSave,
  onSaveHours,
  onDelete,
  onUploadLogo,
  onUploadCover,
}: {
  restaurant: Restaurant;
  hours?: BusinessHours[];
  canDelete?: boolean;
  loading?: boolean;
  error?: string | null;
  onSave: (values: RestaurantFormValues) => void | Promise<void>;
  onSaveHours?: (hours: Array<Pick<BusinessHours, "day_of_week" | "open_time" | "close_time" | "is_closed">>) => void;
  onDelete?: () => void;
  onUploadLogo?: (file: File) => Promise<string>;
  onUploadCover?: (file: File) => Promise<string>;
}) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات المطعم</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantForm
            restaurant={restaurant}
            slugLocked
            loading={loading}
            error={error}
            onSubmit={onSave}
            onUploadLogo={onUploadLogo}
            onUploadCover={onUploadCover}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>أوقات العمل</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantHours hours={hours} onChange={onSaveHours} />
        </CardContent>
      </Card>
      {canDelete ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>منطقة الخطر</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfirmAction
              title="حذف المطعم نهائيًا؟"
              description="سيتم حذف المنيو والمنتجات والبيانات المرتبطة. لا يمكن التراجع."
              confirmLabel="حذف المطعم"
              onConfirm={() => onDelete?.()}
            >
              {(open) => (
                <Button variant="danger" onClick={open}>
                  حذف المطعم
                </Button>
              )}
            </ConfirmAction>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
