<?php

namespace Modules\Operations\Models;

use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Models\BaseModel;

class SocialLink extends BaseModel
{
    use Auditable, PublishesContentChanges;

    public const UPDATED_AT = null;

    protected $table = 'social_links';

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'sort_order' => 'integer'];
    }

    public function auditRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }

    public function contentRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }
}
