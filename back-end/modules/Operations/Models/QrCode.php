<?php

namespace Modules\Operations\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Catalog\Models\Menu;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Models\BaseModel;

class QrCode extends BaseModel
{
    use Auditable;

    public const UPDATED_AT = null;

    protected $table = 'qr_codes';

    protected function casts(): array
    {
        return ['logo_enabled' => 'boolean'];
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function auditRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }

    public function auditEntity(): string
    {
        return 'qr_code';
    }
}
