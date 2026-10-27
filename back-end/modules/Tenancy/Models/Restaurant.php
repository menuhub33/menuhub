<?php

namespace Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Enums\BusinessType;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Models\BaseModel;
use Modules\Users\Models\User;

/**
 * The tenant: a restaurant, cafe or shop.
 *
 * Other modules add their own relations (menus, theme, branches...) from
 * their service providers with `Restaurant::resolveRelationUsing()`.
 *
 * @property string $id
 * @property string $slug
 * @property RestaurantStatus $status
 * @property MenuStatus $menu_status
 * @property BusinessType $business_type
 */
class Restaurant extends BaseModel
{
    use Auditable, PublishesContentChanges;

    protected $table = 'restaurants';

    /** Columns an owner/manager may change through the dashboard. */
    public const DASHBOARD_FIELDS = [
        'name', 'slug', 'description', 'phone', 'whatsapp', 'email', 'logo_url',
        'cover_image_url', 'address', 'latitude', 'longitude', 'timezone',
        'default_language', 'currency', 'delivery_enabled', 'chatbot_enabled',
        'chatbot_name', 'chatbot_welcome',
    ];

    protected function casts(): array
    {
        return [
            'status' => RestaurantStatus::class,
            'menu_status' => MenuStatus::class,
            'business_type' => BusinessType::class,
            'delivery_enabled' => 'boolean',
            'chatbot_enabled' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(RestaurantUser::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'restaurant_users')->withPivot(['role', 'is_active']);
    }

    public function owner(): ?User
    {
        return $this->memberships()->where('role', 'OWNER')->with('user')->first()?->user;
    }

    public function isOperational(): bool
    {
        return $this->status->isOperational();
    }

    public function publicUrl(): string
    {
        $root = config('menuhub.root_domain');

        if ($root) {
            return "https://{$this->slug}.{$root}";
        }

        return config('menuhub.frontend_url')."/m/{$this->slug}";
    }

    public function auditRestaurantId(): ?string
    {
        return $this->id;
    }

    public function contentRestaurantId(): ?string
    {
        return $this->id;
    }
}
