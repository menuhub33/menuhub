<?php

namespace Modules\Sales\Services;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Orders\Models\Order;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Enums\PaymentType;
use Modules\Shared\Enums\SalesPaymentStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Money;
use Modules\Tenancy\Models\Restaurant;

/**
 * The single source of every sales number (spec §10).
 *
 * - Sales      = confirmed invoices, by `confirmed_at`.
 * - Collections / refunds = `order_payments` rows, by their own `created_at`.
 * - Receivables = a snapshot of confirmed, non-legacy invoices still owing money.
 * - Everything is scoped to the restaurant currency, and optionally to one branch.
 * - Day boundaries are computed in the restaurant time zone and queried in UTC.
 */
class SalesReportService
{
    /** Per-group profit aggregates over lines whose cost is known (see profitOf). */
    private const PROFIT_COLUMNS = 'SUM(CASE WHEN order_items.cost_snapshot IS NOT NULL THEN order_items.line_net ELSE 0 END) as costed_net, '
        .'SUM(CASE WHEN order_items.cost_snapshot IS NOT NULL THEN order_items.cost_snapshot * order_items.quantity ELSE 0 END) as cost, '
        .'SUM(CASE WHEN order_items.cost_snapshot IS NULL THEN 1 ELSE 0 END) as uncosted';

    public const PERIODS = ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'custom'];

    /** @return array{0: Carbon, 1: Carbon} UTC [from, to) */
    public function range(Restaurant $restaurant, string $period, ?string $from = null, ?string $to = null): array
    {
        $zone = $restaurant->timezone ?: 'UTC';
        $now = Carbon::now($zone);

        [$start, $end] = match ($period) {
            'today' => [$now->copy()->startOfDay(), $now->copy()->addDay()->startOfDay()],
            'yesterday' => [$now->copy()->subDay()->startOfDay(), $now->copy()->startOfDay()],
            'last_7_days' => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->addDay()->startOfDay()],
            'last_30_days' => [$now->copy()->subDays(29)->startOfDay(), $now->copy()->addDay()->startOfDay()],
            'this_month' => [$now->copy()->startOfMonth(), $now->copy()->addMonth()->startOfMonth()],
            'last_month' => [$now->copy()->subMonthNoOverflow()->startOfMonth(), $now->copy()->startOfMonth()],
            'custom' => $this->customRange($zone, $from, $to),
            default => throw ApiException::invalid('الفترة غير صالحة', 'INVALID_PERIOD'),
        };

        return [$start->utc(), $end->utc()];
    }

    /** @return array<string, mixed> */
    public function summary(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): array
    {
        $sales = $this->sales($restaurant, $from, $to, $branchId);
        $total = Money::cents((clone $sales)->sum('total'));
        $count = (clone $sales)->count();

        $collections = $this->paymentTotal($restaurant, $from, $to, $branchId, PaymentType::Collection);
        $refunds = $this->paymentTotal($restaurant, $from, $to, $branchId, PaymentType::Refund);

        $receivables = $this->base($restaurant, $branchId)
            ->where('status', OrderStatus::Confirmed->value)
            ->where('is_legacy', false)
            ->whereIn('payment_status', [SalesPaymentStatus::Unpaid->value, SalesPaymentStatus::Partial->value]);

        $unpaid = Money::cents((clone $receivables)->sum(DB::raw('total - paid_amount')));
        $profit = $this->profitability($restaurant, $from, $to, $branchId);

        return [
            'currency' => $restaurant->currency,
            'from' => $from->toIso8601String(),
            'to' => $to->toIso8601String(),
            'sales_total' => Money::float($total),
            'invoices_count' => $count,
            'average_invoice' => $count > 0 ? Money::float((int) round($total / $count)) : 0.0,
            'collections_total' => Money::float($collections),
            'refunds_total' => Money::float($refunds),
            'net_collections' => Money::float($collections - $refunds),
            'unpaid_total' => Money::float($unpaid),
            'unpaid_invoices_count' => (clone $receivables)->count(),
            ...$profit,
            'cancelled_count' => $this->base($restaurant, $branchId)
                ->where('status', OrderStatus::Cancelled->value)
                ->whereBetween('cancelled_at', [$from, $to])
                ->count(),
            'orders_needing_pricing' => $this->sales($restaurant, $from, $to, $branchId)
                ->whereExists(fn ($q) => $q->select(DB::raw(1))->from('order_items')
                    ->whereColumn('order_items.order_id', 'orders.id')->whereNull('order_items.line_total'))
                ->count(),
            'excluded_other_currency_orders' => DB::table('orders')
                ->where('restaurant_id', $restaurant->id)
                ->where('status', OrderStatus::Confirmed->value)
                ->where('currency', '!=', $restaurant->currency)
                ->whereBetween('confirmed_at', [$from, $to])
                ->count(),
        ];
    }

    /**
     * Profit = what was sold minus what the products cost, from cost_snapshot taken at sale time.
     * Only lines whose cost was known count; cost_coverage_percent says how much of the sales that is.
     * Other expenses (rent, salaries...) are not known to the system, so this is profit after product cost.
     *
     * @return array<string, mixed>
     */
    private function profitability(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): array
    {
        $all = Money::cents($this->items($restaurant, $from, $to, $branchId)->sum('order_items.line_net'));
        $costed = $this->items($restaurant, $from, $to, $branchId)->whereNotNull('order_items.cost_snapshot');

        $revenue = Money::cents((clone $costed)->sum('order_items.line_net'));
        $cost = Money::cents((clone $costed)->sum(DB::raw('order_items.cost_snapshot * order_items.quantity')));
        $profit = $revenue - $cost;

        return [
            'cost_total' => Money::float($cost),
            'costed_sales_total' => Money::float($revenue),
            'profit_total' => Money::float($profit),
            'profit_margin_percent' => $revenue > 0 ? round($profit * 100 / $revenue, 1) : 0.0,
            'cost_coverage_percent' => $all > 0 ? round($revenue * 100 / $all, 1) : 100.0,
            'uncosted_items_count' => $this->items($restaurant, $from, $to, $branchId)->whereNull('order_items.cost_snapshot')->count(),
        ];
    }

    /**
     * Sales and invoice counts split by channel or order type (based on sales, never on payments).
     *
     * @return list<array<string, mixed>>
     */
    public function distribution(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId, string $by): array
    {
        $column = $by === 'order_type' ? 'delivery_type' : 'channel';

        $rows = $this->sales($restaurant, $from, $to, $branchId)
            ->selectRaw("{$column} as bucket, COUNT(*) as invoices, SUM(total) as total")
            ->groupBy($column)
            ->get();

        return $this->withShare($rows, 'total')->map(fn ($row) => [
            $by === 'order_type' ? 'order_type' : 'channel' => $by === 'order_type'
                ? (Order::ORDER_TYPES[$row->bucket] ?? strtoupper((string) $row->bucket))
                : $row->bucket,
            'invoices_count' => (int) $row->invoices,
            'sales_total' => (float) $row->total_float,
            'share_percent' => $row->share,
        ])->values()->all();
    }

    /** Actual money collected per payment method (collections only). @return list<array<string, mixed>> */
    public function paymentMethods(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): array
    {
        $rows = $this->payments($restaurant, $from, $to, $branchId, PaymentType::Collection)
            ->selectRaw('method, COUNT(*) as operations, SUM(amount) as total')
            ->groupBy('method')
            ->get();

        return $this->withShare($rows, 'total')->map(fn ($row) => [
            'method' => $row->method,
            'operations_count' => (int) $row->operations,
            'collections_total' => (float) $row->total_float,
            'share_percent' => $row->share,
        ])->values()->all();
    }

    /**
     * Sales per day (or hour, max 7 days), bucketed in the restaurant time zone.
     *
     * @return list<array{bucket:string,invoices_count:int,sales_total:float}>
     */
    public function timeseries(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId, string $granularity): array
    {
        if ($granularity === 'hour' && $from->diffInDays($to) > 7) {
            throw ApiException::invalid('التجميع بالساعة متاح لفترة 7 أيام كحد أقصى', 'INVALID_PERIOD');
        }

        $zone = $restaurant->timezone ?: 'UTC';
        $format = $granularity === 'hour' ? 'Y-m-d H:00' : 'Y-m-d';
        $buckets = [];

        $rows = $this->sales($restaurant, $from, $to, $branchId)->select('confirmed_at', 'total')->cursor();
        foreach ($rows as $row) {
            $key = Carbon::parse($row->confirmed_at, 'UTC')->setTimezone($zone)->format($format);
            $buckets[$key] ??= ['cents' => 0, 'count' => 0];
            $buckets[$key]['cents'] += Money::cents($row->total);
            $buckets[$key]['count']++;
        }
        ksort($buckets);

        return collect($buckets)->map(fn ($b, $key) => [
            'bucket' => $key,
            'invoices_count' => $b['count'],
            'sales_total' => Money::float($b['cents']),
        ])->values()->all();
    }

    /** @return list<array<string, mixed>> */
    public function products(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId, string $direction, int $limit): array
    {
        return $this->items($restaurant, $from, $to, $branchId)
            ->selectRaw('order_items.product_id, MAX(order_items.name_ar) as name, SUM(order_items.quantity) as quantity, SUM(order_items.line_net) as net, '.self::PROFIT_COLUMNS)
            ->groupBy('order_items.product_id')
            ->orderBy('net', $direction === 'asc' ? 'asc' : 'desc')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'product_id' => $row->product_id,
                'name' => $row->name,
                'quantity_sold' => (int) $row->quantity,
                'sales_total' => Money::float(Money::cents($row->net)),
                ...$this->profitOf($row),
            ])->all();
    }

    /** @return list<array<string, mixed>> */
    public function categories(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): array
    {
        $rows = $this->items($restaurant, $from, $to, $branchId)
            ->selectRaw('order_items.category_name_snapshot as name, SUM(order_items.quantity) as quantity, SUM(order_items.line_net) as total, '.self::PROFIT_COLUMNS)
            ->groupBy('order_items.category_name_snapshot')
            ->orderByDesc('total')
            ->get();

        return $this->withShare($rows, 'total')->map(fn ($row) => [
            'category' => $row->name ?? 'غير مصنّف',
            'quantity_sold' => (int) $row->quantity,
            'sales_total' => (float) $row->total_float,
            'share_percent' => $row->share,
            ...$this->profitOf($row),
        ])->values()->all();
    }

    /**
     * What each employee sold vs what each one collected. They are never merged:
     * a waiter opens an order and the cashier collects it.
     *
     * @return list<array<string, mixed>>
     */
    public function staff(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): array
    {
        $sold = $this->sales($restaurant, $from, $to, $branchId)
            ->whereNotNull('opened_by')
            ->selectRaw('opened_by as user_id, COUNT(*) as orders, SUM(total) as total')
            ->groupBy('opened_by')->get()->keyBy('user_id');

        $moved = $this->payments($restaurant, $from, $to, $branchId, null)
            ->selectRaw("created_by as user_id, SUM(CASE WHEN type = 'COLLECTION' THEN amount ELSE 0 END) as collected, SUM(CASE WHEN type = 'REFUND' THEN amount ELSE 0 END) as refunded")
            ->groupBy('created_by')->get()->keyBy('user_id');

        $ids = $sold->keys()->merge($moved->keys())->unique()->values();
        $names = DB::table('users')->whereIn('id', $ids)->pluck('full_name', 'id');

        return $ids->map(fn ($id) => [
            'user_id' => $id,
            'name' => $names[$id] ?? null,
            'orders_count' => (int) ($sold[$id]->orders ?? 0),
            'sales_total' => Money::float(Money::cents($sold[$id]->total ?? 0)),
            'collections_total' => Money::float(Money::cents($moved[$id]->collected ?? 0)),
            'refunds_total' => Money::float(Money::cents($moved[$id]->refunded ?? 0)),
        ])->sortByDesc('sales_total')->values()->all();
    }

    /** @return list<array<string, mixed>> */
    public function branches(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): array
    {
        $sales = $this->sales($restaurant, $from, $to, $branchId)
            ->selectRaw('branch_id, MAX(branch_name) as name, COUNT(*) as invoices, SUM(total) as total')
            ->groupBy('branch_id')->get()->keyBy(fn ($row) => $row->branch_id ?? '');

        $collected = $this->payments($restaurant, $from, $to, $branchId, PaymentType::Collection)
            ->selectRaw('branch_id, SUM(amount) as total')->groupBy('branch_id')->get()
            ->keyBy(fn ($row) => $row->branch_id ?? '');

        return $sales->keys()->merge($collected->keys())->unique()->map(function ($key) use ($sales, $collected) {
            $invoices = (int) ($sales[$key]->invoices ?? 0);
            $total = Money::cents($sales[$key]->total ?? 0);

            return [
                'branch_id' => $key === '' ? null : $key,
                'branch_name' => $sales[$key]->name ?? null,
                'invoices_count' => $invoices,
                'sales_total' => Money::float($total),
                'collections_total' => Money::float(Money::cents($collected[$key]->total ?? 0)),
                'average_invoice' => $invoices > 0 ? Money::float((int) round($total / $invoices)) : 0.0,
            ];
        })->sortByDesc('sales_total')->values()->all();
    }

    /** The signed-in user's own collections in the period. @return array<string, mixed> */
    public function collectionsOf(Restaurant $restaurant, Carbon $from, Carbon $to, string $userId): array
    {
        $rows = $this->payments($restaurant, $from, $to, null, null)
            ->where('created_by', $userId)
            ->selectRaw('type, method, COUNT(*) as operations, SUM(amount) as total')
            ->groupBy('type', 'method')->get();

        $byMethod = [];
        $collected = $refunded = 0;
        foreach ($rows as $row) {
            $cents = Money::cents($row->total);
            if ($row->type === PaymentType::Collection->value) {
                $collected += $cents;
                $byMethod[$row->method] = ['operations_count' => (int) $row->operations, 'total' => Money::float($cents)];
            } else {
                $refunded += $cents;
            }
        }

        return [
            'currency' => $restaurant->currency,
            'collections_total' => Money::float($collected),
            'refunds_total' => Money::float($refunded),
            'net_collections' => Money::float($collected - $refunded),
            'by_method' => $byMethod,
        ];
    }

    /* ---------------------------------------------------------------- queries */

    private function base(Restaurant $restaurant, ?string $branchId): Builder
    {
        return DB::table('orders')
            ->where('orders.restaurant_id', $restaurant->id)
            ->where('orders.currency', $restaurant->currency)
            ->when($branchId, fn ($q) => $q->where('orders.branch_id', $branchId));
    }

    /** Confirmed invoices confirmed in the period. */
    private function sales(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): Builder
    {
        return $this->base($restaurant, $branchId)
            ->where('orders.status', OrderStatus::Confirmed->value)
            ->where('orders.confirmed_at', '>=', $from)
            ->where('orders.confirmed_at', '<', $to);
    }

    private function items(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId): Builder
    {
        return $this->sales($restaurant, $from, $to, $branchId)
            ->join('order_items', 'order_items.order_id', '=', 'orders.id')
            ->whereNotNull('order_items.line_net');
    }

    private function payments(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId, ?PaymentType $type): Builder
    {
        return DB::table('order_payments')
            ->where('restaurant_id', $restaurant->id)
            ->where('created_at', '>=', $from)
            ->where('created_at', '<', $to)
            ->when($type, fn ($q) => $q->where('type', $type->value))
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));
    }

    private function paymentTotal(Restaurant $restaurant, Carbon $from, Carbon $to, ?string $branchId, PaymentType $type): int
    {
        return Money::cents($this->payments($restaurant, $from, $to, $branchId, $type)->sum('amount'));
    }

    /**
     * Adds `total_float` and `share` (percentage of the grand total, 1 decimal) to each row.
     *
     * @param  Collection<int, object>  $rows
     * @return Collection<int, object>
     */
    private function withShare($rows, string $field)
    {
        $grand = $rows->sum(fn ($row) => Money::cents($row->{$field}));

        return $rows->map(function ($row) use ($field, $grand) {
            $cents = Money::cents($row->{$field});
            $row->total_float = Money::float($cents);
            $row->share = $grand > 0 ? round($cents * 100 / $grand, 1) : 0.0;

            return $row;
        });
    }

    /**
     * profit_total is null when no line of the group has a known cost.
     *
     * @return array{cost_total: float, profit_total: ?float, has_uncosted_items: bool}
     */
    private function profitOf(object $row): array
    {
        $costed = Money::cents($row->costed_net);
        $cost = Money::cents($row->cost);
        $known = (int) $row->uncosted === 0 || $costed > 0 || $cost > 0;

        return [
            'cost_total' => Money::float($cost),
            'profit_total' => $known ? Money::float($costed - $cost) : null,
            'has_uncosted_items' => (int) $row->uncosted > 0,
        ];
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function customRange(string $zone, ?string $from, ?string $to): array
    {
        if (! $from || ! $to) {
            throw ApiException::invalid('حدد بداية ونهاية الفترة', 'INVALID_PERIOD');
        }

        $start = Carbon::parse($from, $zone)->startOfDay();
        $end = Carbon::parse($to, $zone)->addDay()->startOfDay();

        if ($end <= $start || $start->diffInDays($end) > 366) {
            throw ApiException::invalid('الفترة المخصصة غير صالحة (الحد الأقصى 366 يوماً)', 'INVALID_PERIOD');
        }

        return [$start, $end];
    }
}
