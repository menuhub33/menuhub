<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Append-only money ledger: rows are never updated or deleted (enforced in the model).
        Schema::create('order_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('type', 12);
            $table->string('method', 10);
            $table->decimal('amount', 12, 2);
            $table->decimal('tendered_amount', 12, 2)->nullable();
            $table->decimal('change_amount', 12, 2)->nullable();
            $table->string('reason', 255)->nullable();
            $table->string('notes', 500)->nullable();
            $table->string('reference', 100)->nullable();
            $table->uuid('refund_of_id')->nullable();
            $table->uuid('created_by');
            $table->uuid('branch_id')->nullable();
            $table->char('client_request_id', 36)->nullable();
            $table->char('request_hash', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['restaurant_id', 'client_request_id'], 'order_payments_client_request_unique');
            $table->index('order_id');
            $table->index(['restaurant_id', 'type', 'created_at'], 'order_payments_type_idx');
            $table->index(['restaurant_id', 'created_by', 'created_at'], 'order_payments_user_idx');
            $table->index(['restaurant_id', 'method', 'created_at'], 'order_payments_method_idx');
        });

        Schema::create('sales_counters', function (Blueprint $table) {
            $table->foreignUuid('restaurant_id')->primary()->constrained('restaurants')->cascadeOnDelete();
            $table->unsignedBigInteger('last_number')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_counters');
        Schema::dropIfExists('order_payments');
    }
};
