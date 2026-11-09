<?php
require __DIR__ . "/vendor/autoload.php";
$app = require __DIR__ . "/bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$restaurant = Modules\Tenancy\Models\Restaurant::where("slug", "test-2")->first();
$membership = $restaurant->memberships()->with("user")->first();
$user = $membership->user;
$token = $user->createToken("flag-check")->plainTextToken;
echo $token . "\n" . $user->id . "\n" . $restaurant->id . "\n";
