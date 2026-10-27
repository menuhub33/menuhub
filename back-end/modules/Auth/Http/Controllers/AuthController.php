<?php

namespace Modules\Auth\Http\Controllers;

use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Modules\Auth\Services\AuthService;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Rules\ImageUrl;
use Modules\Users\Http\Resources\UserResource;
use Modules\Users\Models\User;

class AuthController extends ApiController
{
    public function __construct(private readonly AuthService $auth) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:50'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $result = $this->auth->register($data, $data['device_name'] ?? 'web');

        return response()->json([
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
                'email_verification_required' => $result['token'] === null,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $result = $this->auth->login($data['email'], $data['password'], $data['device_name'] ?? 'web');

        return $this->ok([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->message('تم تسجيل الخروج');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->ok(new UserResource($request->user()));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'avatar_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
        ]);

        $user = $request->user();
        $user->fill($data)->save();

        return $this->ok(new UserResource($user->refresh()));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'different:current_password', Password::min(8)],
        ]);

        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ApiException::invalid('كلمة المرور الحالية غير صحيحة', 'WRONG_PASSWORD');
        }

        $user->forceFill(['password' => $data['password']])->save();
        // Sign out every other device.
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return $this->message('تم تحديث كلمة المرور');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        PasswordBroker::sendResetLink(['email' => strtolower($data['email'])]);

        // Same answer whether or not the e-mail exists (no account enumeration).
        return $this->message('إن كان البريد مسجلاً فستصلك رسالة لإعادة تعيين كلمة المرور.');
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', Password::min(8)],
        ]);

        $status = PasswordBroker::reset(
            ['email' => strtolower($data['email']), 'password' => $data['password'], 'token' => $data['token']],
            function (User $user, string $password) {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            }
        );

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            throw ApiException::invalid('تعذر تحديث كلمة المرور. أعد فتح رابط الاستعادة', 'INVALID_RESET_TOKEN');
        }

        return $this->message('تم تحديث كلمة المرور');
    }

    public function verifyEmail(Request $request, string $id, string $hash): RedirectResponse
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect()->away(config('menuhub.frontend_url').'/login?verified=1');
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return $this->message('تم إرسال رابط التأكيد');
    }
}
