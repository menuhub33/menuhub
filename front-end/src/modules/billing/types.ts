export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_menus: number | null;
  max_products: number | null;
  max_branches: number | null;
  max_staff: number | null;
  analytics_enabled: boolean;
  custom_domain_enabled: boolean;
  remove_branding: boolean;
  advanced_analytics: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  transaction_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  invoice_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
};
