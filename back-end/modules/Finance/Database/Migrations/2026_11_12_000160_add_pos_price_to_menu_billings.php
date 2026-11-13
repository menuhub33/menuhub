<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_billings', function (Blueprint $table) {
            // The part of `price` that comes from the restaurant's optional POS package (0 = none).
            $table->decimal('pos_price', 12, 2)->default(0)->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('menu_billings', function (Blueprint $table) {
            $table->dropColumn('pos_price');
        });
    }
};
