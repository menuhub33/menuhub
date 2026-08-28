"use server";

import { bootstrapRestaurant } from "@/actions/restaurants/bootstrapRestaurant";
import {
  fail,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { Restaurant } from "@/lib/types";

export type CreateRestaurantInput = {
  name: string;
  email: string;
  password: string;
  slug?: string;
  description?: string | null;
  phone?: string | null;
};

export async function createRestaurant(
  input: CreateRestaurantInput
): Promise<ActionResult<Restaurant>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  return bootstrapRestaurant({
    name: input.name,
    email: input.email,
    password: input.password,
    slug: input.slug,
    description: input.description,
    phone: input.phone,
  });
}
