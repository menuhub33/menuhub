<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Restaurants created by an admin with a plan used to get a second, newer "free trial" subscription on top of the
 * plan they were given, so every restaurant looked (and was limited as) Free. Drops those shadowing rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        $freeId = DB::table('plans')->where('slug', 'free')->value('id');

        if (! $freeId) {
            return;
        }

        $shadows = DB::table('subscriptions as s')
            ->where('s.plan_id', $freeId)
            ->where('s.status', 'TRIAL')
            ->whereExists(function ($query) use ($freeId) {
                $query->select(DB::raw(1))
                    ->from('subscriptions as other')
                    ->whereColumn('other.restaurant_id', 's.restaurant_id')
                    ->where('other.plan_id', '!=', $freeId)
                    ->whereIn('other.status', ['TRIAL', 'ACTIVE', 'PAST_DUE']);
            })
            ->pluck('s.id');

        if ($shadows->isNotEmpty()) {
            DB::table('subscriptions')->whereIn('id', $shadows->all())->delete();
        }
    }

    public function down(): void
    {
        // The removed rows were duplicates created by mistake; nothing to restore.
    }
};
