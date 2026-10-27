<?php

namespace Modules\Catalog\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Catalog\Models\OptionGroup;

/** @mixin OptionGroup */
class OptionGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'selection_type' => $this->selection_type->value,
            'is_required' => $this->is_required,
            'min_selection' => $this->min_selection,
            'max_selection' => $this->max_selection,
            'sort_order' => $this->sort_order,
            'options' => $this->whenLoaded('options', fn () => $this->options->map(fn ($option) => [
                'id' => $option->id,
                'option_group_id' => $option->option_group_id,
                'name_ar' => $option->name_ar,
                'name_en' => $option->name_en,
                'price_delta' => (float) $option->price_delta,
                'sort_order' => $option->sort_order,
                'is_active' => $option->is_active,
            ])->values()),
        ];
    }
}
