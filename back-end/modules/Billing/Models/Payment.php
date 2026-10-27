<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Enums\PaymentStatus;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Restaurant;

/**
 * @property PaymentStatus $status
 */
class Payment extends BaseModel
{
    public const UPDATED_AT = null;

    protected $table = 'payments';

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'status' => PaymentStatus::class,
            'paid_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
