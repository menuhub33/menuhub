<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('products', 'season')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('season');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('season', 20)->nullable()->after('is_featured');
        });
    }
};
