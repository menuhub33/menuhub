<?php

namespace Modules\Shared\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Modules\Shared\Support\ModuleServiceProvider;

class SharedServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        $this->configureRateLimiters();
    }

    private function configureRateLimiters(): void
    {
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)
            ->by(strtolower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('public', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));

        RateLimiter::for('events', fn (Request $request) => Limit::perMinute(90)->by($request->ip()));

        RateLimiter::for('chat', fn (Request $request) => [
            Limit::perMinute((int) config('menuhub.chatbot.per_minute', 20))
                ->by('chat|'.$request->route('slug')),
            Limit::perMinute(10)->by('chat-ip|'.$request->ip()),
        ]);

        RateLimiter::for('uploads', fn (Request $request) => Limit::perMinute(30)
            ->by($request->user()?->getAuthIdentifier() ?: $request->ip()));
    }
}
