<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The POS is an optional package decided per restaurant (OFF | CASHIER | CASHIER_WAITER),
 * not a feature of the subscription plan: the plan flag added earlier is removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('pos_mode', 20)->default('OFF');
        });

        if (Schema::hasColumn('plans', 'pos_enabled')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->dropColumn('pos_enabled');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('plans', 'pos_enabled')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->boolean('pos_enabled')->default(false);
            });
        }

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn('pos_mode');
        });
    }
};
