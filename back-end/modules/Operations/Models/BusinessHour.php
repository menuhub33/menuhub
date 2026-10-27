<?php

namespace Modules\Operations\Models;

use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Models\BaseModel;

class BusinessHour extends BaseModel
{
    use PublishesContentChanges;

    public const UPDATED_AT = null;

    protected $table = 'business_hours';

    protected function casts(): array
    {
        return ['is_closed' => 'boolean', 'day_of_week' => 'integer'];
    }

    public function contentRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }
}
