<?php

namespace Modules\Shared\Enums;

enum SalesChannel: string
{
    case Pos = 'POS';
    case Qr = 'QR';
    case Staff = 'STAFF';
    case External = 'EXTERNAL';
}
