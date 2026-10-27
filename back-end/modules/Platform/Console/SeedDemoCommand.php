<?php

namespace Modules\Platform\Console;

use Illuminate\Console\Command;
use Modules\Platform\Services\DemoCatalogService;
use Modules\Platform\Support\DemoData;

class SeedDemoCommand extends Command
{
    protected $signature = 'menuhub:seed-demo {slug? : demo | demo-cars (all when omitted)}';

    protected $description = 'Create or rebuild the public sample menus';

    public function handle(DemoCatalogService $demos): int
    {
        $slugs = $this->argument('slug') ? [$this->argument('slug')] : DemoData::KEYS;

        foreach ($slugs as $slug) {
            if (! in_array($slug, DemoData::KEYS, true)) {
                $this->error("Unknown demo: {$slug}");

                return self::FAILURE;
            }

            $demos->seed($slug);
            $this->info("Seeded {$slug}");
        }

        return self::SUCCESS;
    }
}
