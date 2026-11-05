<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_complaints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('product_name', 120);
            $table->string('description', 1000);
            $table->timestamps();
            $table->index(['restaurant_id', 'created_at']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['complaint_type', 'complaint_note', 'complained_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_complaints');

        Schema::table('orders', function (Blueprint $table) {
            $table->string('complaint_type', 30)->nullable()->after('confirmed_at');
            $table->string('complaint_note', 500)->nullable()->after('complaint_type');
            $table->timestamp('complained_at')->nullable()->after('complaint_note');
        });
    }
};
