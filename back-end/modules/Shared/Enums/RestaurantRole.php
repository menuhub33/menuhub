<?php

namespace Modules\Shared\Enums;

enum RestaurantRole: string
{
    case Owner = 'OWNER';
    case Manager = 'MANAGER';
    case Editor = 'EDITOR';
}
