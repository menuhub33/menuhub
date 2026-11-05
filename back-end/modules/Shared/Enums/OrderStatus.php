<?php

namespace Modules\Shared\Enums;

enum OrderStatus: string
{
    case Pending = 'PENDING';
    case Confirmed = 'CONFIRMED';
    case Rejected = 'REJECTED';
}
