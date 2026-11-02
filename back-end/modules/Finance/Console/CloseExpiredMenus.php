<?php

namespace Modules\Finance\Console;

use Illuminate\Console\Command;
use Modules\Finance\Services\YearlyMenuSubscription;

class CloseExpiredMenus extends Command
{
    protected $signature = 'menus:close-expired';

    protected $description = 'Stop menus whose yearly subscription has ended and notify the admin or mall';

    public function handle(YearlyMenuSubscription $subscriptions): int
    {
        $closed = $subscriptions->closeDue();
        $this->info("Closed {$closed} expired menu subscription(s).");

        return self::SUCCESS;
    }
}
