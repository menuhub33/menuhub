<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_users', function (Blueprint $table) {
            // NULL = the member works across every branch.
            $table->uuid('branch_id')->nullable();
            $table->index('branch_id', 'restaurant_users_branch_idx');
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_users', function (Blueprint $table) {
            $table->dropIndex('restaurant_users_branch_idx');
            $table->dropColumn('branch_id');
        });
    }
};
