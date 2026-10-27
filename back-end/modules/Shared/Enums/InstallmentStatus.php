<?php

namespace Modules\Shared\Enums;

enum InstallmentStatus: string
{
    case Pending = 'PENDING';
    case Paid = 'PAID';
}
