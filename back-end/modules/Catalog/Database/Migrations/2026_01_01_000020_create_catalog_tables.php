<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('slug', 100);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->boolean('is_default')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'slug']);
            $table->index('restaurant_id');
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('menu_id')->constrained('menus')->cascadeOnDelete();
            $table->string('name_ar', 150);
            $table->string('name_en', 150)->nullable();
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->text('image_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('menu_id');
        });

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('categories')->cascadeOnDelete();
            $table->string('name_ar', 200);
            $table->string('name_en', 200)->nullable();
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('old_price', 12, 2)->nullable();
            $table->string('currency', 10)->default('SYP');
            $table->integer('sort_order')->default(0);
            $table->string('status', 20)->default('AVAILABLE')->index();
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index('category_id');
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->text('image_url');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->index('product_id');
        });

        Schema::create('product_option_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name_ar', 150);
            $table->string('name_en', 150)->nullable();
            $table->string('selection_type', 20)->default('SINGLE');
            $table->boolean('is_required')->default(false);
            $table->integer('min_selection')->default(0);
            $table->integer('max_selection')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('product_id');
        });

        Schema::create('product_options', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('option_group_id')->constrained('product_option_groups')->cascadeOnDelete();
            $table->string('name_ar', 150);
            $table->string('name_en', 150)->nullable();
            $table->decimal('price_delta', 12, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('option_group_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_options');
        Schema::dropIfExists('product_option_groups');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('menus');
    }
};
