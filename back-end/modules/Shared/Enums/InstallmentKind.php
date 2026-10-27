<?php

namespace Modules\Shared\Enums;

enum InstallmentKind: string
{
    case Installment = 'INSTALLMENT';
    case Renewal = 'RENEWAL';
}
