<?php

namespace Modules\Shared\Enums;

enum StockMovementReason: string
{
    case Sale = 'SALE';
    case CancelReturn = 'CANCEL_RETURN';
    case Adjustment = 'ADJUSTMENT';
}
