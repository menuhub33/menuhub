<?php

use Illuminate\Support\Facades\Route;
use Modules\Chatbot\Http\Controllers\ChatController;

Route::post('public/menus/{slug}/chat', [ChatController::class, 'ask'])->middleware('throttle:chat');
