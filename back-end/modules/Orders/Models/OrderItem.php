<?php

namespace Modules\Orders\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Catalog\Models\Product;
use Modules\Shared\Models\BaseModel;

class OrderItem extends BaseModel
{
    protected $table = 'order_items';

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'extra' => 'decimal:2',
            'line_total' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'line_net' => 'decimal:2',
            'cost_snapshot' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
