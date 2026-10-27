<?php

namespace Modules\Tenancy\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Tenancy\Models\Restaurant;

/** @mixin Restaurant */
class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'email' => $this->email,
            'logo_url' => $this->logo_url,
            'cover_image_url' => $this->cover_image_url,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'timezone' => $this->timezone,
            'default_language' => $this->default_language,
            'currency' => $this->currency,
            'status' => $this->status->value,
            'menu_status' => $this->menu_status->value,
            'delivery_enabled' => $this->delivery_enabled,
            'business_type' => $this->business_type->value,
            'chatbot_enabled' => $this->chatbot_enabled,
            'chatbot_name' => $this->chatbot_name,
            'chatbot_welcome' => $this->chatbot_welcome,
            'public_url' => $this->publicUrl(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
