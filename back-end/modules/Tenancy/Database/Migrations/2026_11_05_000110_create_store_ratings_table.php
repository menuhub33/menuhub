<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('restaurants', 'mall_rating')) {
            Schema::table('restaurants', function (Blueprint $table) {
                $table->dropColumn(['mall_rating', 'mall_rating_note']);
            });
        }

        Schema::create('store_ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->uuid('visitor_key');
            $table->unsignedTinyInteger('score');
            $table->timestamps();

            $table->unique(['restaurant_id', 'visitor_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_ratings');

        Schema::table('restaurants', function (Blueprint $table) {
            $table->unsignedTinyInteger('mall_rating')->nullable();
            $table->string('mall_rating_note', 500)->nullable();
        });
    }
};
