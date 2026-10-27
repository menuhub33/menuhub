<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('whatsapp', 50)->nullable();
            $table->string('email')->nullable();
            $table->text('logo_url')->nullable();
            $table->text('cover_image_url')->nullable();
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('timezone', 100)->default('Asia/Damascus');
            $table->string('default_language', 10)->default('ar');
            $table->string('currency', 10)->default('SYP');
            // Admin activates a restaurant; owners can never self-provision.
            $table->string('status', 20)->default('SUSPENDED')->index();
            $table->string('menu_status', 20)->default('DRAFT');
            $table->boolean('delivery_enabled')->default(true);
            // RESTAURANT | CAFE | SHOP — admin only.
            $table->string('business_type', 20)->default('RESTAURANT');
            $table->boolean('chatbot_enabled')->default(true);
            $table->string('chatbot_name', 80)->nullable();
            $table->text('chatbot_welcome')->nullable();
            $table->timestamps();
        });

        Schema::create('restaurant_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 20)->default('EDITOR');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['restaurant_id', 'user_id']);
            $table->index('user_id');
        });

        Schema::create('reserved_subdomains', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 100)->unique();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reserved_subdomains');
        Schema::dropIfExists('restaurant_users');
        Schema::dropIfExists('restaurants');
    }
};
