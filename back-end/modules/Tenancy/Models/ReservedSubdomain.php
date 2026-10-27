<?php

namespace Modules\Tenancy\Models;

use Modules\Shared\Models\BaseModel;

class ReservedSubdomain extends BaseModel
{
    public $timestamps = false;

    protected $table = 'reserved_subdomains';
}
