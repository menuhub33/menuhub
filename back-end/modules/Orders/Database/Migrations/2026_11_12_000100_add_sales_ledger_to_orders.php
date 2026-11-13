<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Turns `orders` into the single sales ledger (see pos-spec.md §4.1 / §4.2).
 *
 * Purely additive: every new column is nullable or has a safe default, so the
 * existing QR flow keeps working untouched. Rows that already exist are QR
 * orders (channel default) and are flagged `is_legacy`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('channel', 20)->default('QR');
            $table->string('payment_status', 20)->default('UNPAID');
            $table->boolean('is_legacy')->default(false);
            $table->uuid('opened_by')->nullable();
            $table->uuid('cashier_id')->nullable();
            $table->uuid('confirmed_by')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->uuid('discount_approved_by')->nullable();
            $table->string('discount_note', 255)->nullable();
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('refunded_amount', 12, 2)->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->uuid('cancelled_by')->nullable();
            $table->string('cancel_reason', 500)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('inventory_deducted_at')->nullable();
            $table->timestamp('inventory_restored_at')->nullable();
            $table->char('client_request_id', 36)->nullable();
            $table->char('request_hash', 64)->nullable();

            $table->unique(['restaurant_id', 'client_request_id'], 'orders_restaurant_client_request_unique');
            $table->index(['restaurant_id', 'channel', 'status', 'confirmed_at'], 'orders_ledger_channel_idx');
            $table->index(['restaurant_id', 'payment_status', 'status'], 'orders_ledger_payment_idx');
            $table->index(['restaurant_id', 'branch_id', 'confirmed_at'], 'orders_ledger_branch_idx');
            $table->index(['restaurant_id', 'opened_by', 'confirmed_at'], 'orders_ledger_opened_by_idx');
            $table->index(['restaurant_id', 'confirmed_at'], 'orders_ledger_confirmed_idx');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('line_net', 12, 2)->nullable();
            $table->string('note', 500)->nullable();
            $table->uuid('category_id_snapshot')->nullable();
            $table->string('category_name_snapshot', 200)->nullable();
            $table->decimal('cost_snapshot', 12, 2)->nullable();
        });

        $this->backfill();
    }

    /** Idempotent and chunked, safe to re-run. */
    private function backfill(): void
    {
        DB::table('orders')->orderBy('id')->chunkById(1000, function ($orders) {
            $ids = $orders->pluck('id')->all();

            DB::table('orders')->whereIn('id', $ids)->update(['is_legacy' => true]);

            // Orders confirmed through the old flow already took stock out.
            DB::table('orders')
                ->whereIn('id', $ids)
                ->where('status', 'CONFIRMED')
                ->whereNull('inventory_deducted_at')
                ->update(['inventory_deducted_at' => DB::raw('confirmed_at')]);

            DB::table('orders')
                ->whereIn('id', $ids)
                ->where('subtotal', 0)
                ->where('total', '>', 0)
                ->update(['subtotal' => DB::raw('total')]);
        });

        DB::table('order_items')->orderBy('id')->chunkById(1000, function ($items) {
            DB::table('order_items')
                ->whereIn('id', $items->pluck('id')->all())
                ->whereNull('line_net')
                ->whereNotNull('line_total')
                ->update(['line_net' => DB::raw('line_total')]);
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn([
                'discount_total', 'line_net', 'note',
                'category_id_snapshot', 'category_name_snapshot', 'cost_snapshot',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique('orders_restaurant_client_request_unique');
            $table->dropIndex('orders_ledger_channel_idx');
            $table->dropIndex('orders_ledger_payment_idx');
            $table->dropIndex('orders_ledger_branch_idx');
            $table->dropIndex('orders_ledger_opened_by_idx');
            $table->dropIndex('orders_ledger_confirmed_idx');
            $table->dropColumn([
                'channel', 'payment_status', 'is_legacy', 'opened_by', 'cashier_id', 'confirmed_by',
                'branch_id', 'subtotal', 'discount_total', 'discount_approved_by', 'discount_note',
                'paid_amount', 'refunded_amount', 'paid_at', 'cancelled_at', 'cancelled_by',
                'cancel_reason', 'notes', 'inventory_deducted_at', 'inventory_restored_at',
                'client_request_id', 'request_hash',
            ]);
        });
    }
};
