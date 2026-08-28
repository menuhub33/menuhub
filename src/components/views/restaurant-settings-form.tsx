"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRestaurant } from "@/actions/restaurants/updateRestaurant";
import { uploadImageFile } from "@/lib/upload-client";
import { PageHeader } from "@/components/layout/page-header";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { Restaurant } from "@/lib/types";

export function RestaurantSettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [phone, setPhone] = useState(restaurant.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(restaurant.whatsapp ?? "");
  const [address, setAddress] = useState(restaurant.address ?? "");
  const [latitude, setLatitude] = useState(restaurant.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(restaurant.longitude?.toString() ?? "");
  const [deliveryEnabled, setDeliveryEnabled] = useState(restaurant.delivery_enabled !== false);
  const [chatbotEnabled, setChatbotEnabled] = useState(restaurant.chatbot_enabled !== false);
  const [chatbotName, setChatbotName] = useState(restaurant.chatbot_name ?? "");
  const [chatbotWelcome, setChatbotWelcome] = useState(restaurant.chatbot_welcome ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updateRestaurant({
      id: restaurant.id,
      name,
      description,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      address,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      delivery_enabled: deliveryEnabled,
      chatbot_enabled: chatbotEnabled,
      chatbot_name: chatbotName.trim() || null,
      chatbot_welcome: chatbotWelcome.trim() || null,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast({ title: "تم حفظ بيانات النشاط", variant: "success" });
    router.refresh();
  }

  async function upload(kind: "logo_url" | "cover_image_url", file: File) {
    const uploaded = await uploadImageFile(file, `restaurants/${restaurant.id}`);
    if (uploaded.error || !uploaded.data) {
      toast({ title: uploaded.error ?? "تعذر الرفع", variant: "error" });
      return;
    }
    await updateRestaurant({ id: restaurant.id, [kind]: uploaded.data.url });
    toast({ title: "تم تحديث الصورة", variant: "success" });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid max-w-2xl gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="الاسم" htmlFor="name" required hint="اسم المطعم أو الكافيه أو المحل">
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
      </FormField>
      <FormField label="الوصف" htmlFor="description">
        <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </FormField>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <Switch
          id="delivery-enabled"
          checked={deliveryEnabled}
          onCheckedChange={setDeliveryEnabled}
          label="تفعيل خدمة التوصيل على الموقع"
        />
        <p className="mt-2 text-xs text-zinc-500">
          عند الإيقاف لن يظهر خيار التوصيل للزبائن في صفحة الطلب.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <Switch
          id="chatbot-enabled"
          checked={chatbotEnabled}
          onCheckedChange={setChatbotEnabled}
          label="تفعيل مساعد المنيو"
        />
        <p className="mt-2 text-xs text-zinc-500">
          يظهر زر الدردشة للزبائن في المنيو العام ويجيب عن الأصناف والأسعار والتوصيل.
        </p>
        {chatbotEnabled ? (
          <div className="mt-4 grid gap-4">
            <FormField label="اسم المساعد" htmlFor="chatbot-name" hint="يظهر في عنوان نافذة الدردشة">
              <Input
                id="chatbot-name"
                placeholder={`مساعد ${restaurant.name}`}
                value={chatbotName}
                onChange={(event) => setChatbotName(event.target.value)}
              />
            </FormField>
            <FormField label="رسالة الترحيب" htmlFor="chatbot-welcome">
              <Textarea
                id="chatbot-welcome"
                rows={3}
                placeholder={`مرحباً، أنا مساعد ${restaurant.name}. اسألني عن الأصناف والأسعار.`}
                value={chatbotWelcome}
                onChange={(event) => setChatbotWelcome(event.target.value)}
              />
            </FormField>
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="رقم التواصل"
          htmlFor="phone"
          hint="يظهر في المنيو العام ويُستخدم للتواصل مع الزبائن"
        >
          <Input
            id="phone"
            dir="ltr"
            inputMode="tel"
            placeholder="09xxxxxxxx"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </FormField>
        <FormField
          label="واتساب الطلبات"
          htmlFor="whatsapp"
          hint="يُرسل إليه الطلب. إن تُرك فارغاً يُستخدم رقم التواصل"
        >
          <Input
            id="whatsapp"
            dir="ltr"
            inputMode="tel"
            placeholder="9639xxxxxxxx"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
        </FormField>
      </div>
      <FormField label="العنوان" htmlFor="address">
        <Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="خط العرض" htmlFor="lat">
          <Input id="lat" dir="ltr" value={latitude} onChange={(event) => setLatitude(event.target.value)} />
        </FormField>
        <FormField label="خط الطول" htmlFor="lng">
          <Input id="lng" dir="ltr" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
        </FormField>
      </div>
      <FormField label="الشعار">
        <Input type="file" accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload("logo_url", file);
        }} />
      </FormField>
      <FormField label="صورة الغلاف">
        <Input type="file" accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload("cover_image_url", file);
        }} />
      </FormField>
      <Button type="submit" loading={loading}>حفظ</Button>
    </form>
  );
}

export function RestaurantPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "النشاط", href: "/dashboard/restaurant" },
          { label: title },
        ]}
      />
      {children}
    </div>
  );
}
