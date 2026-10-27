<?php

namespace Modules\Shared\Enums;

enum DiscountType: string
{
    case None = 'NONE';
    case Percent = 'PERCENT';
    case Amount = 'AMOUNT';
}
