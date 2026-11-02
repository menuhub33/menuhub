<?php

namespace Modules\Theming\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Mall;

/**
 * Visual theme of a mall directory. Same columns the restaurant menu uses.
 *
 * @property string $mall_id
 * @property string $primary_color
 * @property string $secondary_color
 * @property string $background_color
 * @property string $text_color
 * @property string|null $font_family
 * @property string|null $custom_css
 */
class MallTheme extends BaseModel
{
    protected $table = 'mall_themes';

    public function mall(): BelongsTo
    {
        return $this->belongsTo(Mall::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }
}
