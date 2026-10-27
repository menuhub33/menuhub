<?php

namespace Modules\Shared\Enums;

enum EventType: string
{
    case MenuView = 'MENU_VIEW';
    case ProductView = 'PRODUCT_VIEW';
    case Search = 'SEARCH';
    case QrScan = 'QR_SCAN';
    case Share = 'SHARE';
}
