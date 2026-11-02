<?php

namespace Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Models\BaseModel;

/**
 * A commercial center. Stores (restaurants) point at it with mall_id.
 * A null mall_id means a private store menu.
 *
 * @property string $id
 * @property string $name
 * @property string $slug
 * @property string $status
 */
class Mall extends BaseModel
{
    protected $table = 'malls';

    public function managers(): HasMany
    {
        return $this->hasMany(MallUser::class);
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class);
    }

    public function isPublished(): bool
    {
        return $this->status === 'PUBLISHED';
    }

    public function publicUrl(): string
    {
        return rtrim((string) config('menuhub.frontend_url'), '/')."/c/{$this->slug}";
    }
}
