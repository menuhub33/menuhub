<?php

namespace Modules\Shared\Enums;

enum ProductStatus: string
{
    case Available = 'AVAILABLE';
    case Unavailable = 'UNAVAILABLE';
    case Hidden = 'HIDDEN';
}
