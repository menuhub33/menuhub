<?php

namespace Modules\Auth\Services;

use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Modules\Shared\Exceptions\ApiException;
use Modules\Users\Models\User;
use Modules\Users\Services\UserService;

class AuthService
{
    public function __construct(private readonly UserService $users) {}

    /**
     * Self-registration only ever creates a USER account. Restaurants are
     * provisioned by platform administrators (see Platform module).
     *
     * @param  array{full_name:string,email:string,password:string,phone?:?string}  $data
     * @return array{user: User, token: ?string}
     */
    public function register(array $data, string $device = 'web'): array
    {
        $user = $this->users->create($data);

        event(new Registered($user));

        $token = config('menuhub.require_email_verification') ? null : $this->issueToken($user, $device);

        return ['user' => $user, 'token' => $token];
    }

    /**
     * @return array{user: User, token: string}
     */
    public function login(string $email, string $password, string $device = 'web'): array
    {
        $user = User::query()->where('email', strtolower(trim($email)))->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw new ApiException('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS');
        }

        if (! $user->is_active) {
            throw ApiException::forbidden('حسابك معلّق. تواصل مع الإدارة', 'ACCOUNT_SUSPENDED');
        }

        if (config('menuhub.require_email_verification') && ! $user->hasVerifiedEmail()) {
            throw ApiException::forbidden('يرجى تأكيد بريدك الإلكتروني أولاً', 'EMAIL_NOT_VERIFIED');
        }

        return ['user' => $user, 'token' => $this->issueToken($user, $device)];
    }

    public function issueToken(User $user, string $device = 'web'): string
    {
        return $user->createToken(substr($device, 0, 100) ?: 'web')->plainTextToken;
    }
}
