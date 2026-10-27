<?php

namespace Modules\Shared\Enums;

enum PlatformRole: string
{
    case User = 'USER';
    case Admin = 'ADMIN';
    case SuperAdmin = 'SUPER_ADMIN';

    public function isAdmin(): bool
    {
        return $this !== self::User;
    }

    public function isSuperAdmin(): bool
    {
        return $this === self::SuperAdmin;
    }
}
