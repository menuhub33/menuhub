<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('themes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->text('preview_image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_premium')->default(false);
            $table->timestamps();
        });

        Schema::create('restaurant_themes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->unique()->constrained('restaurants')->cascadeOnDelete();
            $table->foreignUuid('theme_id')->nullable()->constrained('themes')->nullOnDelete();
            $table->string('primary_color', 20)->default('#000000');
            $table->string('secondary_color', 20)->default('#FFFFFF');
            $table->string('background_color', 20)->default('#FFFFFF');
            $table->string('text_color', 20)->default('#111111');
            $table->string('font_family', 100)->nullable();
            $table->text('custom_css')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_themes');
        Schema::dropIfExists('themes');
    }
};
