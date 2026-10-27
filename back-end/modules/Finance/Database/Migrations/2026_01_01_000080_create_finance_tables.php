<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_billings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->unique()->constrained('restaurants')->cascadeOnDelete();
            $table->decimal('price', 12, 2);
            $table->decimal('setup_cost', 12, 2)->default(0);
            $table->decimal('annual_renewal', 12, 2)->default(0);
            $table->string('discount_type', 10)->default('NONE');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->unsignedSmallInteger('installments_count')->default(1);
            $table->string('currency', 10)->default('SYP');
            $table->date('starts_on');
            $table->date('next_renewal_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('menu_installments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('billing_id')->constrained('menu_billings')->cascadeOnDelete();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('kind', 12)->default('INSTALLMENT');
            $table->unsignedInteger('sequence');
            $table->decimal('amount', 12, 2);
            $table->date('due_on');
            $table->string('status', 10)->default('PENDING');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['billing_id', 'kind', 'sequence']);
            $table->index(['billing_id', 'kind', 'sequence'], 'menu_installments_billing_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_installments');
        Schema::dropIfExists('menu_billings');
    }
};
