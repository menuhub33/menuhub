<?php

namespace Modules\Auth\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Shared\Enums\PlatformRole;
use Modules\Shared\Tests\ApiTestCase;
use Modules\Users\Models\User;

class AuthTest extends ApiTestCase
{
    public function test_user_can_register_login_and_read_profile(): void
    {
        $this->postJson($this->api('auth/register'), [
            'full_name' => 'Ahmad',
            'email' => 'ahmad@example.com',
            'password' => 'password123',
        ])->assertCreated()->assertJsonPath('data.user.email', 'ahmad@example.com');

        $token = $this->postJson($this->api('auth/login'), [
            'email' => 'ahmad@example.com',
            'password' => 'password123',
        ])->assertOk()->json('data.token');

        $this->withToken($token)->getJson($this->api('auth/me'))
            ->assertOk()->assertJsonPath('data.email', 'ahmad@example.com');
    }

    public function test_wrong_password_is_rejected(): void
    {
        $this->makeUser(email: 'a@example.com');

        $this->postJson($this->api('auth/login'), ['email' => 'a@example.com', 'password' => 'nope-nope'])
            ->assertStatus(401);
    }

    public function test_suspended_account_cannot_use_the_api(): void
    {
        $user = $this->makeUser();
        $user->forceFill(['is_active' => false])->save();
        Sanctum::actingAs($user);

        $this->getJson($this->api('auth/me'))->assertForbidden();
    }

    /** Regression: the original profiles policy let users promote themselves. */
    public function test_user_cannot_escalate_platform_role_through_profile_or_registration(): void
    {
        $this->postJson($this->api('auth/register'), [
            'full_name' => 'Evil',
            'email' => 'evil@example.com',
            'password' => 'password123',
            'platform_role' => 'SUPER_ADMIN',
            'is_active' => true,
        ])->assertCreated();

        $evil = User::query()->where('email', 'evil@example.com')->firstOrFail();
        $this->assertSame(PlatformRole::User, $evil->platform_role);

        Sanctum::actingAs($evil);
        $this->patchJson($this->api('auth/me'), ['full_name' => 'Still Evil', 'platform_role' => 'ADMIN'])->assertOk();

        $this->assertSame(PlatformRole::User, $evil->refresh()->platform_role);
        $this->getJson($this->api('admin/users'))->assertForbidden();
    }

    public function test_admin_cannot_grant_admin_roles_but_super_admin_can(): void
    {
        $admin = $this->makeUser(PlatformRole::Admin);
        $target = $this->makeUser();

        Sanctum::actingAs($admin);
        $this->patchJson($this->api("admin/users/{$target->id}"), ['platform_role' => 'ADMIN'])->assertForbidden();

        Sanctum::actingAs($this->makeUser(PlatformRole::SuperAdmin));
        $this->patchJson($this->api("admin/users/{$target->id}"), ['platform_role' => 'ADMIN'])->assertOk();
        $this->assertSame(PlatformRole::Admin, $target->refresh()->platform_role);
    }
}
