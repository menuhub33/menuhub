<?php

namespace Modules\Shared\Enums;

enum SubscriptionStatus: string
{
    case Trial = 'TRIAL';
    case Active = 'ACTIVE';
    case PastDue = 'PAST_DUE';
    case Expired = 'EXPIRED';
    case Cancelled = 'CANCELLED';
}
