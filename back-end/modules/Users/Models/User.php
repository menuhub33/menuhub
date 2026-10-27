<?php

namespace Modules\Users\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Modules\Shared\Enums\PlatformRole;

/**
 * The platform account (the original `profiles` table).
 *
 * `platform_role` and `is_active` are NOT mass-assignable on purpose: they
 * can only be changed by an administrator through UserService.
 *
 * @property string $id
 * @property string $full_name
 * @property string $email
 * @property PlatformRole $platform_role
 * @property bool $is_active
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasUuids, Notifiable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'users';

    protected $fillable = ['full_name', 'email', 'password', 'phone', 'avatar_url'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'platform_role' => PlatformRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function isPlatformAdmin(): bool
    {
        return $this->platform_role?->isAdmin() ?? false;
    }

    public function isSuperAdmin(): bool
    {
        return $this->platform_role?->isSuperAdmin() ?? false;
    }

    public function scopeSearch($query, ?string $term)
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('full_name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%");
        });
    }
}
