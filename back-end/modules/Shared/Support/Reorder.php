<?php

namespace Modules\Shared\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class Reorder
{
    /**
     * Applies `sort_order` values. $scoped limits which rows may be touched
     * (tenant scope), so ids of other restaurants are silently ignored.
     *
     * @param  list<array{id:string,sort_order:int}>  $items
     */
    public static function apply(Builder $scoped, array $items): void
    {
        DB::transaction(function () use ($scoped, $items) {
            foreach ($items as $item) {
                (clone $scoped)->whereKey($item['id'])->update(['sort_order' => (int) $item['sort_order']]);
            }
        });
    }

    /**
     * Moves one row to a zero-based position and renumbers the whole scope
     * so the stored order matches what the menu shows.
     */
    public static function place(Builder $scoped, string $id, int $position): void
    {
        $ids = (clone $scoped)->orderBy('sort_order')->orderBy('created_at')->pluck('id')->all();
        $ids = array_values(array_filter($ids, fn ($existing) => (string) $existing !== $id));
        $index = max(0, min($position, count($ids)));
        array_splice($ids, $index, 0, [$id]);

        self::apply($scoped, array_map(
            fn ($existingId, $order) => ['id' => (string) $existingId, 'sort_order' => $order],
            $ids,
            array_keys($ids),
        ));
    }

    /** Rewrites sort_order as 0..n-1 in the current display order. */
    public static function normalize(Builder $scoped): void
    {
        $ids = (clone $scoped)->orderBy('sort_order')->orderBy('created_at')->pluck('id')->all();

        self::apply($scoped, array_map(
            fn ($existingId, $order) => ['id' => (string) $existingId, 'sort_order' => $order],
            $ids,
            array_keys($ids),
        ));
    }
}
