<?php

namespace Modules\Tenancy\Services;

use Modules\Shared\Support\Slug;
use Modules\Tenancy\Models\ReservedSubdomain;
use Modules\Tenancy\Models\Restaurant;

class RestaurantService
{
    /**
     * Returns an Arabic explanation when the slug cannot be used, else null.
     */
    public function slugProblem(string $slug, ?string $ignoreRestaurantId = null): ?string
    {
        $slug = strtolower(trim($slug));

        if (! Slug::isValid($slug)) {
            return 'صيغة الرابط غير صحيحة. استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات';
        }

        if ($this->isReserved($slug)) {
            return 'هذا الرابط محجوز ولا يمكن استخدامه';
        }

        $taken = Restaurant::query()
            ->where('slug', $slug)
            ->when($ignoreRestaurantId, fn ($q) => $q->where('id', '!=', $ignoreRestaurantId))
            ->exists();

        return $taken ? 'هذا الرابط مستخدم لنشاط آخر' : null;
    }

    public function isReserved(string $slug): bool
    {
        return in_array($slug, config('menuhub.reserved_subdomains', []), true)
            || ReservedSubdomain::query()->where('slug', $slug)->exists();
    }

    /** First free, valid slug starting from $base (-2, -3 ... suffixes). */
    public function uniqueSlug(string $base): string
    {
        $base = $base !== '' ? strtolower($base) : Slug::fromName('');
        $slug = $base;

        for ($attempt = 2; $attempt <= 25; $attempt++) {
            if ($this->slugProblem($slug) === null) {
                return $slug;
            }
            $slug = "{$base}-{$attempt}";
        }

        return $base.'-'.substr((string) time(), -6);
    }

    /**
     * Dashboard update: only whitelisted columns, never status/business_type.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Restaurant $restaurant, array $data): Restaurant
    {
        $restaurant->fill(array_intersect_key($data, array_flip(Restaurant::DASHBOARD_FIELDS)));
        $restaurant->save();

        return $restaurant->refresh();
    }
}
