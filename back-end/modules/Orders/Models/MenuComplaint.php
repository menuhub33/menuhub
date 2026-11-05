<?php

namespace Modules\Orders\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Restaurant;

/**
 * @property string $product_name
 * @property string $description
 */
class MenuComplaint extends BaseModel
{
    protected $table = 'menu_complaints';

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
