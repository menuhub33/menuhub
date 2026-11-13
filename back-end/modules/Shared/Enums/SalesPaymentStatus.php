<?php

namespace Modules\Shared\Enums;

/** Payment status of a sales invoice (not to be confused with the subscription PaymentStatus). */
enum SalesPaymentStatus: string
{
    case Unpaid = 'UNPAID';
    case Partial = 'PARTIAL';
    case Paid = 'PAID';
    case Refunded = 'REFUNDED';
}
