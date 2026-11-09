<?php
require __DIR__ . "/vendor/autoload.php";
$app = require __DIR__ . "/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$rows = Illuminate\Support\Facades\DB::table("audit_logs")
    ->where("entity_type", "restaurant")
    ->orderByDesc("created_at")
    ->limit(15)
    ->get(["action", "created_at", "old_data", "new_data"]);
foreach ($rows as $row) {
    echo $row->created_at . " " . $row->action . "\n";
    echo "OLD " . $row->old_data . "\n";
    echo "NEW " . $row->new_data . "\n---\n";
}
