<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        DB::table('products')->whereNull('price')->update(['price' => 0]);

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->nullable(false)->change();
        });
    }
};
