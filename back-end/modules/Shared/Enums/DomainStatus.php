<?php

namespace Modules\Shared\Enums;

enum DomainStatus: string
{
    case Pending = 'PENDING';
    case Verifying = 'VERIFYING';
    case Active = 'ACTIVE';
    case Failed = 'FAILED';
    case Disabled = 'DISABLED';
}
