<?php

namespace Modules\Orders\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Orders\Http\Resources\OrderResource;
use Modules\Orders\Services\OrderService;
use Modules\Shared\Http\Controllers\ApiController;

class PublicOrderController extends ApiController
{
    public function __construct(private readonly OrderService $orders) {}

    public function store(Request $request, string $slug): JsonResponse
    {
        $data = $request->validate([
            'delivery_type' => ['required', Rule::in(['delivery', 'dine_in', 'pickup'])],
            'branch_name' => ['nullable', 'string', 'max:200'],
            'table_number' => ['required_if:delivery_type,dine_in', 'nullable', 'string', 'max:50'],
            'address' => ['required_if:delivery_type,delivery', 'nullable', 'string', 'max:500'],
            'latitude' => ['required_if:delivery_type,delivery', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_if:delivery_type,delivery', 'nullable', 'numeric', 'between:-180,180'],
            'items' => ['required', 'array', 'min:1', 'max:40'],
            'items.*.product_id' => ['required', 'uuid', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.extra' => ['sometimes', 'numeric', 'min:0', 'max:9999999999'],
        ]);

        return $this->created(new OrderResource($this->orders->place($slug, $data)));
    }

    public function complain(Request $request, string $slug): JsonResponse
    {
        $data = $request->validate([
            'product_name' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:1000'],
        ]);

        $complaint = $this->orders->complain($slug, $data['product_name'], $data['description']);

        return $this->created([
            'id' => $complaint->id,
            'product_name' => $complaint->product_name,
            'description' => $complaint->description,
        ]);
    }
}
