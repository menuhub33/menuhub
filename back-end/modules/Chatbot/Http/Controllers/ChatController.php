<?php

namespace Modules\Chatbot\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Chatbot\Services\CatalogBuilder;
use Modules\Chatbot\Services\ChatService;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Storefront\Services\PublicMenuService;

class ChatController extends ApiController
{
    public function __construct(
        private readonly PublicMenuService $menus,
        private readonly CatalogBuilder $builder,
        private readonly ChatService $chat,
    ) {}

    public function ask(Request $request, string $slug): JsonResponse
    {
        $max = (int) config('menuhub.chatbot.max_messages');
        $maxContent = (int) config('menuhub.chatbot.max_content');

        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1'],
            'messages.*.role' => ['required', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:'.$maxContent],
        ]);

        $messages = collect(array_slice($data['messages'], -$max))
            ->map(fn ($m) => ['role' => $m['role'], 'content' => trim($m['content'])])
            ->all();

        if (! collect($messages)->contains(fn ($m) => $m['role'] === 'user' && $m['content'] !== '')) {
            throw new ApiException('الرسالة غير صالحة', 422);
        }

        $state = $this->menus->resolve($slug);

        if (($state['kind'] ?? null) !== 'live') {
            throw new ApiException('المنيو غير متاح حالياً', 404);
        }

        if (! $state['data']['restaurant']['chatbot_enabled']) {
            throw new ApiException('مساعد المنيو غير مفعّل', 403);
        }

        $catalog = $this->builder->build($state['data']);

        return $this->ok($this->chat->reply($catalog, $messages));
    }
}
