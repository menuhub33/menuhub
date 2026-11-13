<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Kitchen screen: preparation status of an order (NEW / PREPARING / READY / SERVED).
 *
 * Additive. A confirmed order shows up in the kitchen while its status is not SERVED,
 * so every order that exists before this migration is marked SERVED (it is history).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('kitchen_status', 20)->default('NEW');
            $table->timestamp('kitchen_status_at')->nullable();

            $table->index(['restaurant_id', 'status', 'kitchen_status'], 'orders_kitchen_queue_idx');
        });

        // Idempotent and chunked.
        DB::table('orders')->orderBy('id')->chunkById(1000, function ($orders) {
            DB::table('orders')
                ->whereIn('id', $orders->pluck('id')->all())
                ->update(['kitchen_status' => 'SERVED']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_kitchen_queue_idx');
            $table->dropColumn(['kitchen_status', 'kitchen_status_at']);
        });
    }
};
