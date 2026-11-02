<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Support\BillingCalculator as Calc;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_billings', function (Blueprint $table) {
            $table->timestamp('expired_notified_at')->nullable()->after('next_renewal_on');
        });

        DB::table('menu_installments')
            ->where('kind', 'RENEWAL')
            ->where('status', 'PENDING')
            ->delete();

        foreach (MenuBilling::query()->whereNull('next_renewal_on')->get() as $billing) {
            $billing->forceFill([
                'next_renewal_on' => Calc::addMonths($billing->starts_on->toDateString(), 12),
            ])->save();
        }
    }

    public function down(): void
    {
        Schema::table('menu_billings', function (Blueprint $table) {
            $table->dropColumn('expired_notified_at');
        });
    }
};
