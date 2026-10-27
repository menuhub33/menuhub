<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Restaurant;

class Invoice extends BaseModel
{
    public const UPDATED_AT = null;

    public const STATUSES = ['PENDING', 'PAID', 'VOID', 'OVERDUE'];

    protected $table = 'invoices';

    protected function casts(): array
    {
        return [
            'subtotal' => 'float',
            'discount' => 'float',
            'tax' => 'float',
            'total' => 'float',
            'due_date' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
