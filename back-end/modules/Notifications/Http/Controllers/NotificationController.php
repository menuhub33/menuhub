<?php

namespace Modules\Notifications\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Notifications\Models\Notification;
use Modules\Shared\Http\Controllers\ApiController;

class NotificationController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::query()
            ->where('user_id', $request->user()->getKey())
            ->when($request->filled('restaurant_id'), fn ($q) => $q->where('restaurant_id', $request->query('restaurant_id')))
            ->when($request->boolean('unread'), fn ($q) => $q->where('is_read', false));

        $unread = (clone $query)->where('is_read', false)->count();
        $page = $query->latest('created_at')->paginate($this->perPage(20));

        return response()->json([
            'data' => $page->items(),
            'meta' => [
                'unread_count' => $unread,
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $item = Notification::query()
            ->where('user_id', $request->user()->getKey())
            ->findOrFail($notification);

        $item->update(['is_read' => true]);

        return $this->ok($item);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = Notification::query()
            ->where('user_id', $request->user()->getKey())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $this->ok(['updated' => $count]);
    }
}
