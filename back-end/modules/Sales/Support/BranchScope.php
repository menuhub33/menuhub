<?php

namespace Modules\Sales\Support;

use Illuminate\Database\Eloquent\Builder;
use Modules\Orders\Models\Order;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Support\TenantContext;

/**
 * Members pinned to a branch (`restaurant_users.branch_id`) only ever see
 * and touch that branch's invoices. Owners / managers without a branch see all.
 */
final class BranchScope
{
    public static function memberBranch(): ?string
    {
        return TenantContext::current()->membership?->branch_id;
    }

    /**
     * @param  Builder<Order>  $query
     * @return Builder<Order>
     */
    public static function apply(Builder $query): Builder
    {
        $branch = self::memberBranch();

        return $branch === null ? $query : $query->where('branch_id', $branch);
    }

    public static function assertAccessible(Order $order): void
    {
        $branch = self::memberBranch();

        if ($branch !== null && $order->branch_id !== $branch) {
            throw ApiException::forbidden('هذه الفاتورة تتبع فرعاً آخر', 'BRANCH_FORBIDDEN');
        }
    }
}
