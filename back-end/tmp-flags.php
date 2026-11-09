<?php
require __DIR__ . "/vendor/autoload.php";
$app = require __DIR__ . "/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$r = Modules\Tenancy\Models\Restaurant::where("slug", "test-2")->first();
$r->delivery_enabled = false;
$r->chatbot_enabled = false;
$r->save();
echo json_encode(["id" => $r->id, "delivery" => $r->delivery_enabled, "chatbot" => $r->chatbot_enabled]);
