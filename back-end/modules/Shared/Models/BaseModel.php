<?php

namespace Modules\Shared\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Base Eloquent model: UUID primary keys (as in the original Postgres schema).
 */
abstract class BaseModel extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = ['id'];
}
