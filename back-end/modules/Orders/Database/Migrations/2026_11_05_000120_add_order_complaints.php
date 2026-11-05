<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('complaint_type', 30)->nullable()->after('confirmed_at');
            $table->string('complaint_note', 500)->nullable()->after('complaint_type');
            $table->timestamp('complained_at')->nullable()->after('complaint_note');
        });

        Schema::dropIfExists('store_ratings');
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['complaint_type', 'complaint_note', 'complained_at']);
        });
    }
};
