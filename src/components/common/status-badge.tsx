import { Badge } from "@/components/ui/badge";
import {
  DOMAIN_STATUS_LABELS,
  MENU_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  RESTAURANT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/components/lib/labels";
import type {
  DomainStatus,
  MenuStatus,
  PaymentStatus,
  ProductStatus,
  RestaurantStatus,
  SubscriptionStatus,
} from "@/lib/types";

type StatusKind =
  | { kind: "product"; value: ProductStatus }
  | { kind: "menu"; value: MenuStatus }
  | { kind: "restaurant"; value: RestaurantStatus }
  | { kind: "subscription"; value: SubscriptionStatus }
  | { kind: "payment"; value: PaymentStatus }
  | { kind: "domain"; value: DomainStatus };

const PRODUCT_VARIANT = {
  AVAILABLE: "success",
  UNAVAILABLE: "warning",
  HIDDEN: "default",
} as const;

const MENU_VARIANT = {
  DRAFT: "default",
  PUBLISHED: "success",
  UNPUBLISHED: "warning",
} as const;

const RESTAURANT_VARIANT = {
  TRIAL: "info",
  ACTIVE: "success",
  SUSPENDED: "warning",
  EXPIRED: "danger",
  CANCELLED: "default",
} as const;

const SUBSCRIPTION_VARIANT = {
  TRIAL: "info",
  ACTIVE: "success",
  PAST_DUE: "warning",
  EXPIRED: "danger",
  CANCELLED: "default",
} as const;

const PAYMENT_VARIANT = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
  REFUNDED: "default",
} as const;

const DOMAIN_VARIANT = {
  PENDING: "warning",
  VERIFYING: "info",
  ACTIVE: "success",
  FAILED: "danger",
  DISABLED: "default",
} as const;

export function StatusBadge(props: StatusKind) {
  if (props.kind === "product") {
    return (
      <Badge variant={PRODUCT_VARIANT[props.value]} dot>
        {PRODUCT_STATUS_LABELS[props.value]}
      </Badge>
    );
  }
  if (props.kind === "menu") {
    return (
      <Badge variant={MENU_VARIANT[props.value]} dot>
        {MENU_STATUS_LABELS[props.value]}
      </Badge>
    );
  }
  if (props.kind === "restaurant") {
    return (
      <Badge variant={RESTAURANT_VARIANT[props.value]} dot>
        {RESTAURANT_STATUS_LABELS[props.value]}
      </Badge>
    );
  }
  if (props.kind === "subscription") {
    return (
      <Badge variant={SUBSCRIPTION_VARIANT[props.value]} dot>
        {SUBSCRIPTION_STATUS_LABELS[props.value]}
      </Badge>
    );
  }
  if (props.kind === "payment") {
    return (
      <Badge variant={PAYMENT_VARIANT[props.value]} dot>
        {PAYMENT_STATUS_LABELS[props.value]}
      </Badge>
    );
  }
  return (
    <Badge variant={DOMAIN_VARIANT[props.value]} dot>
      {DOMAIN_STATUS_LABELS[props.value]}
    </Badge>
  );
}
