<?php

namespace Modules\Operations\Models;

use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Models\BaseModel;

class Branch extends BaseModel
{
    use Auditable, PublishesContentChanges;

    protected $table = 'branches';

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
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
