<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name', 200);
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->cascadeOnDelete();
            $table->string('reason', 20);
            $table->integer('quantity_delta');
            $table->integer('stock_before');
            $table->integer('stock_after');
            $table->uuid('created_by')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // DB-level guard against a duplicate deduction / return for the same order line.
            $table->unique(['order_id', 'product_id', 'reason'], 'stock_movements_order_product_reason_unique');
            $table->index(['restaurant_id', 'product_id', 'created_at'], 'stock_movements_product_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
