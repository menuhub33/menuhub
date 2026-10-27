<?php

namespace Modules\Auth\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Modules\Shared\Support\ModuleServiceProvider;

class AuthServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        // Password reset links open the Next.js page, which then calls the API.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('menuhub.frontend_url').'/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });
    }
}
