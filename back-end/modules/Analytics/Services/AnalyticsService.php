<?php

namespace Modules\Analytics\Services;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Modules\Analytics\Models\AnalyticsEvent;
use Modules\Shared\Enums\EventType;

class AnalyticsService
{
    /**
     * Event counts by type for a period.
     *
     * @return array{menuViews:int,productViews:int,qrScans:int,shares:int,searches:int}
     */
    public function summary(string $restaurantId, ?CarbonInterface $from = null, ?CarbonInterface $to = null): array
    {
        $counts = AnalyticsEvent::query()
            ->forRestaurant($restaurantId)
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->where('created_at', '<=', $to))
            ->select('event_type', DB::raw('count(*) as total'))
            ->groupBy('event_type')
            ->pluck('total', 'event_type');

        return [
            'menuViews' => (int) ($counts[EventType::MenuView->value] ?? 0),
            'productViews' => (int) ($counts[EventType::ProductView->value] ?? 0),
            'qrScans' => (int) ($counts[EventType::QrScan->value] ?? 0),
            'shares' => (int) ($counts[EventType::Share->value] ?? 0),
            'searches' => (int) ($counts[EventType::Search->value] ?? 0),
        ];
    }

    public function countViews(string $restaurantId, CarbonInterface $from): int
    {
        return AnalyticsEvent::query()
            ->forRestaurant($restaurantId)
            ->where('event_type', EventType::MenuView->value)
            ->where('created_at', '>=', $from)
            ->count();
    }

    /** Menu views grouped per day (PHP side, so it works on every database driver). */
    public function dailyViews(string $restaurantId, CarbonInterface $from): array
    {
        return AnalyticsEvent::query()
            ->forRestaurant($restaurantId)
            ->where('event_type', EventType::MenuView->value)
            ->where('created_at', '>=', $from)
            ->get(['created_at'])
            ->groupBy(fn ($e) => $e->created_at->toDateString())
            ->map->count()
            ->sortKeys()
            ->all();
    }

    /** @return list<array{product_id:string,views:int}> */
    public function topProducts(string $restaurantId, CarbonInterface $from, int $limit = 10): array
    {
        return AnalyticsEvent::query()
            ->forRestaurant($restaurantId)
            ->where('event_type', EventType::ProductView->value)
            ->whereNotNull('product_id')
            ->where('created_at', '>=', $from)
            ->select('product_id', DB::raw('count(*) as views'))
            ->groupBy('product_id')
            ->orderByDesc('views')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => ['product_id' => $r->product_id, 'views' => (int) $r->views])
            ->all();
    }

    public static function deviceType(?string $userAgent): string
    {
        $ua = strtolower((string) $userAgent);

        return match (true) {
            $ua === '' => 'unknown',
            (bool) preg_match('/ipad|tablet/', $ua) => 'tablet',
            (bool) preg_match('/mobi|android|iphone/', $ua) => 'mobile',
            default => 'desktop',
        };
    }
}
