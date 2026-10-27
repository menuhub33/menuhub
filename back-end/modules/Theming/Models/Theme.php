<?php

namespace Modules\Theming\Models;

use Modules\Shared\Models\BaseModel;

class Theme extends BaseModel
{
    protected $table = 'themes';

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_premium' => 'boolean',
        ];
    }
}
