<?php

namespace Modules\Media\Models;

use Modules\Shared\Models\BaseModel;

class MediaFile extends BaseModel
{
    protected $table = 'media_files';

    protected function casts(): array
    {
        return [
            'bytes' => 'integer',
        ];
    }
};
