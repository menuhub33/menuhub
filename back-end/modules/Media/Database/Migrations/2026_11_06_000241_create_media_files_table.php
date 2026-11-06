<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('restaurant_id')->constrained('restaurants')->cascadeOnDelete();
            $table->string('key')->unique();
            $table->unsignedInteger('bytes');
            $table->timestamps();

            $table->index('restaurant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};
