<?php

namespace Modules\Billing\Models;

use Modules\Shared\Models\BaseModel;

class Plan extends BaseModel
{
    protected $table = 'plans';

    protected function casts(): array
    {
        return [
            'price_monthly' => 'float',
            'price_yearly' => 'float',
            'max_menus' => 'integer',
            'max_categories' => 'integer',
            'max_products' => 'integer',
            'max_product_images' => 'integer',
            'max_storage_mb' => 'integer',
            'max_branches' => 'integer',
            'max_staff' => 'integer',
            'analytics_enabled' => 'boolean',
            'custom_domain_enabled' => 'boolean',
            'remove_branding' => 'boolean',
            'advanced_analytics' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
