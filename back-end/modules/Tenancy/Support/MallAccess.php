<?php

namespace Modules\Tenancy\Support;

use Illuminate\Database\Eloquent\Builder;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Mall;
use Modules\Tenancy\Models\MallUser;
use Modules\Tenancy\Models\Restaurant;
use Modules\Users\Models\User;

/**
 * Mall managers are ordinary users with a mall_users row.
 * Platform admins are never scoped, even if they also manage a mall.
 */
final class MallAccess
{
    public static function membership(User $user): ?MallUser
    {
        return MallUser::query()
            ->where('user_id', $user->getKey())
            ->where('is_active', true)
            ->first();
    }

    public static function limitsRestaurants(User $user): bool
    {
        return ! $user->isPlatformAdmin() && self::membership($user) !== null;
    }

    /** The mall a non-admin manager is locked to, or null for platform admins. */
    public static function scopedMall(User $user): ?Mall
    {
        if ($user->isPlatformAdmin()) {
            return null;
        }

        return self::membership($user)?->mall;
    }

    public static function scopeRestaurants(Builder $query, User $user): Builder
    {
        $mall = self::scopedMall($user);

        if ($mall) {
            $query->where('mall_id', $mall->id);
        }

        return $query;
    }

    public static function assertRestaurant(User $user, Restaurant $restaurant): void
    {
        $mall = self::scopedMall($user);

        if ($mall && $restaurant->mall_id !== $mall->id) {
            throw ApiException::notFound();
        }
    }

    /** @return array{id: string, name: string, slug: string, status: string, role: string}|null */
    public static function summaryFor(User $user): ?array
    {
        $link = self::membership($user);
        $link?->loadMissing('mall:id,name,slug,status');

        if (! $link?->mall) {
            return null;
        }

        return [
            'id' => $link->mall->id,
            'name' => $link->mall->name,
            'slug' => $link->mall->slug,
            'status' => $link->mall->status,
            'role' => $link->role,
        ];
    }
}
