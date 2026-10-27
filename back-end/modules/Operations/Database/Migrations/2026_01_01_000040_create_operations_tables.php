<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('platform', 50);
            $table->text('url');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('slug', 100);
            $table->string('phone', 50)->nullable();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['restaurant_id', 'slug']);
            $table->index('restaurant_id');
        });

        Schema::create('business_hours', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0 = Sunday ... 6 = Saturday
            $table->time('open_time')->nullable();
            $table->time('close_time')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->index('restaurant_id');
            $table->index('branch_id');
        });

        Schema::create('qr_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->cascadeOnDelete();
            $table->foreignUuid('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->string('name', 150);
            $table->text('qr_url');
            $table->boolean('logo_enabled')->default(false);
            $table->string('format', 10)->default('PNG');
            $table->timestamp('created_at')->useCurrent();

            $table->index('restaurant_id');
        });

        Schema::create('custom_domains', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('domain', 255)->unique();
            $table->string('status', 20)->default('PENDING');
            $table->string('verification_token')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->string('ssl_status', 50)->nullable();
            $table->timestamps();

            $table->index('restaurant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_domains');
        Schema::dropIfExists('qr_codes');
        Schema::dropIfExists('business_hours');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('social_links');
    }
};
