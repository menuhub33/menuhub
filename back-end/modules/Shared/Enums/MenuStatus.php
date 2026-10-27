<?php

namespace Modules\Shared\Enums;

enum MenuStatus: string
{
    case Draft = 'DRAFT';
    case Published = 'PUBLISHED';
    case Unpublished = 'UNPUBLISHED';
}
