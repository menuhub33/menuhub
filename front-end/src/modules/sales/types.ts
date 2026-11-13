export type SalesChannel = "POS" | "QR" | "STAFF" | "EXTERNAL";
export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export type PaymentMethod = "CASH" | "CARD" | "OTHER";
export type SalesPaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type DiscountType = "FIXED" | "PERCENT";

export type KitchenStatus = "NEW" | "PREPARING" | "READY" | "SERVED";

/** An order as the kitchen screen sees it: what to cook, no prices. */
export type KitchenOrder = {
  id: string;
  number: string;
  channel: SalesChannel;
  order_type: OrderType | null;
  table_number: string | null;
  branch_name: string | null;
  notes: string | null;
  kitchen_status: KitchenStatus;
  kitchen_status_at: string | null;
  confirmed_at: string | null;
  opened_by: string | null;
  items: { id: string; name_ar: string; quantity: number; note: string | null }[];
};

export type CatalogCategory = {
  id: string;
  name_ar: string;
  sort_order: number;
};

export type CatalogProduct = {
  id: string;
  category_id: string;
  name_ar: string;
  price: number | null;
  currency: string;
  stock_quantity: number | null;
  image_url: string | null;
  sellable: boolean;
  unsellable_reason: "NO_PRICE" | "CURRENCY" | "OUT_OF_STOCK" | null;
};

export type Catalog = {
  categories: CatalogCategory[];
  products: CatalogProduct[];
  currentPage: number;
  lastPage: number;
};

export type SaleItem = {
  id: string;
  product_id: string | null;
  name_ar: string;
  quantity: number;
  unit_price: number | null;
  discount_total: number;
  line_total: number | null;
  line_net: number | null;
  note: string | null;
};

export type SalePayment = {
  id: string;
  type: "PAYMENT" | "REFUND";
  method: PaymentMethod;
  amount: number;
  tendered_amount: number | null;
  change_amount: number | null;
  reason: string | null;
  notes: string | null;
  reference: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  number: string;
  channel: SalesChannel;
  order_type: OrderType | null;
  status: string;
  fulfillment_status: string;
  payment_status: SalesPaymentStatus;
  is_legacy: boolean;
  currency: string;
  subtotal: number;
  discount_total: number;
  total: number;
  paid_amount: number;
  refunded_amount: number;
  balance_due: number;
  branch_name: string | null;
  table_number: string | null;
  address: string | null;
  notes: string | null;
  opened_by: { id: string; name: string | null } | null;
  created_at: string;
  items?: SaleItem[];
  payments?: SalePayment[];
};

export type Receipt = {
  restaurant: {
    name: string;
    logo_url: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
    timezone: string;
  };
  branch: string | null;
  issued_at_local: string | null;
  employee: string | null;
  order: Sale;
};

export type SaleInput = {
  channel: "POS" | "STAFF" | "EXTERNAL";
  order_type: OrderType;
  table_number?: string;
  address?: string;
  notes?: string;
  items: { product_id: string; quantity: number; note?: string }[];
  discount?: { type: DiscountType; value: number; note?: string };
  payment?: {
    method: PaymentMethod;
    amount?: number;
    tendered_amount?: number;
  };
};

export type CollectInput = {
  method: PaymentMethod;
  amount?: number;
  tendered_amount?: number;
};
