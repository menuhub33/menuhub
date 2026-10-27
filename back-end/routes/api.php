<?php

use Illuminate\Support\Facades\Route;

/*
| Module routes live in modules/{Name}/Routes/api.php and are mounted under
| /api/v1 by each module's service provider. Only the API root is here.
*/
Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'version' => 'v1',
    'status' => 'ok',
]));
