<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('number', 20);
            $table->string('status', 20)->default('PENDING')->index();
            $table->string('delivery_type', 20);
            $table->string('branch_name', 200)->nullable();
            $table->string('table_number', 50)->nullable();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('currency', 10)->default('SYP');
            $table->decimal('total', 12, 2)->default(0);
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'number']);
            $table->index(['restaurant_id', 'created_at']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('name_ar', 200);
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('extra', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2);
            $table->timestamps();

            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
