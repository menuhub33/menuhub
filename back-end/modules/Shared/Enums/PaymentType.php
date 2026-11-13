<?php

namespace Modules\Shared\Enums;

enum PaymentType: string
{
    case Collection = 'COLLECTION';
    case Refund = 'REFUND';
}
