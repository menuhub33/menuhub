<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('unit_price', 12, 2)->nullable()->change();
            $table->decimal('line_total', 12, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('order_items')->whereNull('unit_price')->update(['unit_price' => 0]);
        DB::table('order_items')->whereNull('line_total')->update(['line_total' => 0]);

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('unit_price', 12, 2)->nullable(false)->change();
            $table->decimal('line_total', 12, 2)->nullable(false)->change();
        });
    }
};
