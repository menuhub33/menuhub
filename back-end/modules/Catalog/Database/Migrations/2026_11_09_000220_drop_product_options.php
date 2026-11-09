<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('product_options');
        Schema::dropIfExists('product_option_groups');
    }

    public function down(): void
    {
        // Product options were removed from the product. The tables are not restored.
    }
};
