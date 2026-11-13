<?php

namespace Modules\Shared\Enums;

enum PaymentMethod: string
{
    case Cash = 'CASH';
    case Card = 'CARD';
    case Other = 'OTHER';
}
