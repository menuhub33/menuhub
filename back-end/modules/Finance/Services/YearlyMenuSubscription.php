<?php

namespace Modules\Finance\Services;

use Illuminate\Support\Facades\DB;
use Modules\Catalog\Models\Menu;
use Modules\Finance\Models\MenuBilling;
use Modules\Notifications\Services\NotificationService;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Enums\PlatformRole;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Storefront\Services\PublicMenuService;
use Modules\Tenancy\Models\MallUser;
use Modules\Tenancy\Models\Restaurant;
use Modules\Users\Models\User;

/**
 * A menu contract lasts one year from its start date. When that year ends the
 * menu is unpublished until an administrator saves a new price.
 */
class YearlyMenuSubscription
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly PublicMenuService $menus,
    ) {}

    /** @param  list<string>|null  $restaurantIds */
    public function closeDue(?array $restaurantIds = null): int
    {
        $query = MenuBilling::query()
            ->with('restaurant')
            ->whereNotNull('next_renewal_on')
            ->whereDate('next_renewal_on', '<=', now()->toDateString());

        if ($restaurantIds !== null) {
            $query->whereIn('restaurant_id', $restaurantIds);
        }

        $closed = 0;
        foreach ($query->get() as $billing) {
            if ($billing->restaurant && $this->closeIfDue($billing->restaurant, $billing)) {
                $closed++;
            }
        }

        return $closed;
    }

    public function closeIfDue(Restaurant $restaurant, ?MenuBilling $billing = null): bool
    {
        $billing ??= MenuBilling::query()->where('restaurant_id', $restaurant->id)->first();
        if (! $billing?->next_renewal_on || $billing->next_renewal_on->toDateString() > now()->toDateString()) {
            return false;
        }

        if ($restaurant->status === RestaurantStatus::Cancelled) {
            return false;
        }

        $changed = false;
        if ($restaurant->status !== RestaurantStatus::Expired || $restaurant->menu_status !== MenuStatus::Unpublished) {
            DB::transaction(function () use ($restaurant) {
                $restaurant->forceFill([
                    'status' => RestaurantStatus::Expired,
                    'menu_status' => MenuStatus::Unpublished,
                ])->save();

                Menu::query()
                    ->where('restaurant_id', $restaurant->id)
                    ->where('is_default', true)
                    ->update(['status' => MenuStatus::Unpublished->value]);
            });
            $this->menus->bump($restaurant->id);
            $changed = true;
        }

        if ($billing->expired_notified_at === null) {
            $this->notify($restaurant);
            $billing->forceFill(['expired_notified_at' => now()])->save();
            $changed = true;
        }

        return $changed;
    }

    public function reopen(Restaurant $restaurant): void
    {
        if ($restaurant->status !== RestaurantStatus::Expired) {
            return;
        }

        $restaurant->forceFill([
            'status' => RestaurantStatus::Active,
            'menu_status' => MenuStatus::Published,
        ])->save();

        Menu::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('is_default', true)
            ->update([
                'status' => MenuStatus::Published->value,
                'published_at' => now(),
            ]);

        MenuBilling::query()
            ->where('restaurant_id', $restaurant->id)
            ->update(['expired_notified_at' => null]);

        $this->menus->bump($restaurant->id);
    }

    private function notify(Restaurant $restaurant): void
    {
        $title = 'انتهى الاشتراك السنوي';
        $message = "انتهت سنة اشتراك «{$restaurant->name}» وتوقف المنيو. أعِد تفعيله بسعر جديد بعد التواصل.";

        $userIds = $restaurant->mall_id
            ? MallUser::query()->where('mall_id', $restaurant->mall_id)->pluck('user_id')
            : User::query()->whereIn('platform_role', [PlatformRole::Admin->value, PlatformRole::SuperAdmin->value])->pluck('id');

        foreach ($userIds as $userId) {
            $this->notifications->notifyUser((string) $userId, 'MENU_YEAR_ENDED', $title, $message, $restaurant->id);
        }
    }
}
