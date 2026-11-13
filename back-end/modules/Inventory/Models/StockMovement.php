<?php

namespace Modules\Inventory\Models;

use LogicException;
use Modules\Shared\Enums\StockMovementReason;
use Modules\Shared\Models\BaseModel;

/**
 * Append-only stock history, tied to the sales document that caused it.
 *
 * @property StockMovementReason $reason
 */
class StockMovement extends BaseModel
{
    public const UPDATED_AT = null;

    protected $table = 'stock_movements';

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Stock movements are immutable.'));
        static::deleting(fn () => throw new LogicException('Stock movements cannot be deleted.'));
    }

    protected function casts(): array
    {
        return [
            'reason' => StockMovementReason::class,
            'quantity_delta' => 'integer',
            'stock_before' => 'integer',
            'stock_after' => 'integer',
            'created_at' => 'datetime',
        ];
    }
}
