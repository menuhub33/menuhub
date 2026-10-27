<?php

namespace Modules\Users\Services;

use Illuminate\Support\Facades\Hash;
use Modules\Shared\Enums\PlatformRole;
use Modules\Shared\Exceptions\ApiException;
use Modules\Users\Models\User;

/**
 * The only place allowed to touch privileged columns (role / active flag).
 */
class UserService
{
    /**
     * @param  array{full_name:string,email:string,password:string,phone?:?string}  $data
     */
    public function create(array $data, PlatformRole $role = PlatformRole::User, bool $verified = false): User
    {
        $user = new User([
            'full_name' => trim($data['full_name']),
            'email' => strtolower(trim($data['email'])),
            'password' => $data['password'],
            'phone' => $data['phone'] ?? null,
        ]);
        $user->platform_role = $role;
        $user->is_active = true;
        if ($verified) {
            $user->email_verified_at = now();
        }
        $user->save();

        return $user;
    }

    /**
     * Administrators may manage USER accounts; only a SUPER_ADMIN may grant,
     * revoke or modify ADMIN / SUPER_ADMIN accounts.
     */
    public function assertCanManage(User $actor, ?User $target, ?PlatformRole $newRole = null): void
    {
        if ($actor->isSuperAdmin()) {
            return;
        }

        if ($target && $target->isPlatformAdmin()) {
            throw ApiException::forbidden('فقط المدير الأعلى يمكنه تعديل حسابات المديرين');
        }

        if ($newRole && $newRole->isAdmin()) {
            throw ApiException::forbidden('فقط المدير الأعلى يمكنه منح صلاحيات الإدارة');
        }
    }

    public function update(User $actor, User $target, array $data): User
    {
        $newRole = isset($data['platform_role']) ? PlatformRole::from($data['platform_role']) : null;
        $this->assertCanManage($actor, $target, $newRole);

        if ($actor->is($target) && $newRole && ! $newRole->isAdmin()) {
            throw ApiException::invalid('لا يمكنك إزالة صلاحياتك');
        }

        $target->fill(array_intersect_key($data, array_flip(['full_name', 'phone', 'avatar_url'])));
        if ($newRole) {
            $target->platform_role = $newRole;
        }
        if (! empty($data['password'])) {
            $target->password = $data['password'];
        }
        $target->save();

        return $target->refresh();
    }

    public function setActive(User $actor, User $target, bool $active): User
    {
        $this->assertCanManage($actor, $target);

        if ($actor->is($target) && ! $active) {
            throw ApiException::invalid('لا يمكنك تعليق حسابك الحالي');
        }

        $target->is_active = $active;
        $target->save();

        if (! $active) {
            $target->tokens()->delete();
        }

        return $target;
    }

    public function delete(User $actor, User $target): void
    {
        $this->assertCanManage($actor, $target);

        if ($actor->is($target)) {
            throw ApiException::invalid('لا يمكنك حذف حسابك الحالي');
        }

        $target->tokens()->delete();
        $target->delete();
    }

    public function checkPassword(User $user, string $plain): bool
    {
        return Hash::check($plain, $user->password);
    }
}
