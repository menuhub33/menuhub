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
}
