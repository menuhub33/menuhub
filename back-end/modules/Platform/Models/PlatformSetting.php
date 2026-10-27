<?php

namespace Modules\Platform\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $table = 'platform_settings';

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['value' => 'json', 'updated_at' => 'datetime'];
    }
}
