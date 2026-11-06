<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('max_categories')->nullable();
            $table->integer('max_product_images')->nullable();
            $table->integer('max_storage_mb')->nullable();
        });

        $now = now();

        DB::table('plans')->where('slug', 'free')->update([
            'is_active' => false,
            'updated_at' => $now,
        ]);

        DB::table('plans')->where('slug', 'pro')->update([
            'price_monthly' => 10,
            'price_yearly' => 100,
            'max_menus' => 1,
            'max_categories' => 10,
            'max_products' => 120,
            'max_product_images' => 2,
            'max_storage_mb' => 200,
            'updated_at' => $now,
        ]);

        DB::table('plans')->where('slug', 'business')->update([
            'price_monthly' => 25,
            'price_yearly' => 250,
            'max_menus' => 1,
            'max_categories' => 30,
            'max_products' => 400,
            'max_product_images' => 4,
            'max_storage_mb' => 1200,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['max_categories', 'max_product_images', 'max_storage_mb']);
        });
    }
};
