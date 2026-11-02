<?php

namespace Modules\Tenancy\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Tenancy\Models\Mall;

/** @mixin Mall */
class MallResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'phone' => $this->phone,
            'email' => $this->email,
            'logo_url' => $this->logo_url,
            'cover_image_url' => $this->cover_image_url,
            'address' => $this->address,
            'status' => $this->status,
            'public_url' => $this->publicUrl(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'manager' => $this->whenLoaded('managers', function () {
                $link = $this->managers->first();

                return $link ? [
                    'id' => $link->user?->id,
                    'full_name' => $link->user?->full_name,
                    'email' => $link->user?->email,
                ] : null;
            }),
        ];
    }
}
