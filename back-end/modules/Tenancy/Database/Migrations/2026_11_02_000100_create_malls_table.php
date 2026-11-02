<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('malls', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('email')->nullable();
            $table->text('logo_url')->nullable();
            $table->text('cover_image_url')->nullable();
            $table->text('address')->nullable();
            // PUBLISHED shows the public directory. Stores keep their own menu URLs.
            $table->string('status', 20)->default('UNPUBLISHED')->index();
            $table->timestamps();
        });

        Schema::create('mall_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('mall_id')->constrained('malls')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role', 20)->default('ADMIN');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique('user_id');
            $table->unique(['mall_id', 'user_id']);
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->foreignUuid('mall_id')->nullable()->after('id')->constrained('malls')->nullOnDelete();
            $table->index('mall_id');
        });
    }

    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mall_id');
        });
        Schema::dropIfExists('mall_users');
        Schema::dropIfExists('malls');
    }
};
