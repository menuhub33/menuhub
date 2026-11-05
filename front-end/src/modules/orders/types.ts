export type OrderStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export type OrderDeliveryType = "delivery" | "dine_in" | "pickup";

export type OrderItem = {
  id: string;
  product_id: string | null;
  name_ar: string;
  quantity: number;
  unit_price: number;
  extra: number;
  line_total: number;
};

export type ShopOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  delivery_type: OrderDeliveryType;
  branch_name: string | null;
  table_number: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  total: number;
  confirmed_at: string | null;
  created_at: string;
  items: OrderItem[];
};

export type PlacePublicOrderInput = {
  delivery_type: OrderDeliveryType;
  branch_name?: string | null;
  table_number?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  items: Array<{ product_id: string; quantity: number; extra?: number }>;
};
