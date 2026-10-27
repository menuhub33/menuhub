<?php

namespace Modules\Finance\Providers;

use Illuminate\Support\Facades\Route;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Models\MenuInstallment;
use Modules\Shared\Support\ModuleServiceProvider;

class FinanceServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Route::model('billing', MenuBilling::class);
        Route::model('installment', MenuInstallment::class);
    }
}
