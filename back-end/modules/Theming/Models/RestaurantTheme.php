<?php

namespace Modules\Theming\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Models\BaseModel;

class RestaurantTheme extends BaseModel
{
    use Auditable, PublishesContentChanges;

    protected $table = 'restaurant_themes';

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
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
