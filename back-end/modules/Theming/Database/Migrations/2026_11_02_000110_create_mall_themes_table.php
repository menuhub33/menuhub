<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mall_themes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('mall_id')->unique()->constrained('malls')->cascadeOnDelete();
            $table->foreignUuid('theme_id')->nullable()->constrained('themes')->nullOnDelete();
            $table->string('primary_color', 20)->default('#0f766e');
            $table->string('secondary_color', 20)->default('#115e59');
            $table->string('background_color', 20)->default('#fafafa');
            $table->string('text_color', 20)->default('#18181b');
            $table->string('font_family', 100)->nullable();
            $table->text('custom_css')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mall_themes');
    }
};
