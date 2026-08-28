import { getSubscription } from "@/actions/subscriptions/getSubscription";
import { getPlan } from "@/actions/plans/getPlan";
import { getPayment } from "@/actions/payments/getPayment";
import { getInvoice } from "@/actions/invoices/getInvoice";
import { SubscriptionView } from "@/components/views/subscription-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";
import type { Plan, Subscription } from "@/lib/types";

export default async function SubscriptionPage() {
  const tenant = await requirePermission("subscription.manage");
  const [subs, plans, payments, invoices] = await Promise.all([
    getSubscription(tenant.restaurant.id),
    getPlan(),
    getPayment({ restaurant_id: tenant.restaurant.id }),
    getInvoice({ restaurant_id: tenant.restaurant.id }),
  ]);
  const list = Array.isArray(subs.data) ? subs.data : subs.data ? [subs.data] : [];
  const subscription = (list[0] as Subscription | undefined) ?? null;
  const planList = (Array.isArray(plans.data) ? plans.data : plans.data ? [plans.data] : []) as Plan[];
  const plan = planList.find((item) => item.id === subscription?.plan_id) ?? null;
  const paymentList = Array.isArray(payments.data) ? payments.data : payments.data ? [payments.data] : [];
  const invoiceList = Array.isArray(invoices.data) ? invoices.data : invoices.data ? [invoices.data] : [];

  if (plans.error) return <ErrorState description={plans.error} />;

  return (
    <SubscriptionView
      restaurantId={tenant.restaurant.id}
      subscription={subscription}
      plan={plan}
      plans={planList}
      payments={paymentList}
      invoices={invoiceList}
    />
  );
}
