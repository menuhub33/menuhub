<?php

namespace Modules\Chatbot\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Chatbot\Support\ArabicText as T;

class ChatService
{
    public function __construct(private readonly CatalogAnswerer $answerer) {}

    /**
     * @param  array<string, mixed>  $catalog
     * @param  list<array{role:string,content:string}>  $messages
     * @return array<string, mixed>
     */
    public function reply(array $catalog, array $messages): array
    {
        $users = array_values(array_filter($messages, fn ($m) => $m['role'] === 'user'));
        $last = $users[count($users) - 1]['content'] ?? '';
        $previous = count($users) > 1 ? $users[count($users) - 2]['content'] : null;

        $fallback = $this->answerer->answer($catalog, $last, $previous);
        $llm = $this->completeWithLlm($this->systemPrompt($catalog), $messages);

        if ($llm === null) {
            return $fallback;
        }

        return $this->withContactIfNeeded($llm, $catalog, $fallback['products'], (bool) ($fallback['unknown'] ?? false));
    }

    /** @param  array<string, mixed>  $catalog */
    public function systemPrompt(array $catalog): string
    {
        $copy = $this->answerer->orderCopy($catalog['businessType']);
        $contact = $this->answerer->contactLine($catalog);

        $lines = array_values(array_filter([
            "أنت مساعد منيو \"{$catalog['restaurantName']}\".",
            'أجب بالعربية باختصار وبأسلوب ودّي، ومن بيانات هذا المنيو فقط. لا تخترع أسعاراً أو أصنافاً أو أوقاتاً.',
            $catalog['description'] ? "وصف النشاط: {$catalog['description']}" : null,
            'التوصيل: '.($catalog['deliveryEnabled'] ? "متاح ({$copy['delivery']})" : 'غير متاح'),
            "الاستلام: {$copy['pickup']}",
            $copy['dineIn'] ? "التناول في المكان: {$copy['dineIn']}" : null,
            $catalog['address'] ? "العنوان: {$catalog['address']}" : null,
            $catalog['phone'] ? "الهاتف: {$catalog['phone']}" : null,
            $catalog['whatsapp'] ? "واتساب: {$catalog['whatsapp']}" : null,
            $catalog['hours'] !== []
                ? "ساعات العمل:\n".collect($catalog['hours'])->map(fn ($r) => "{$r['day']}: {$r['text']}")->implode("\n")
                : 'ساعات العمل غير محددة.',
            $catalog['branches'] !== []
                ? "الفروع:\n".collect($catalog['branches'])->map(fn ($b) => trim("{$b['name']} {$b['address']}"))->implode("\n")
                : null,
            'المنيو:',
        ]));

        foreach ($catalog['categories'] as $category) {
            $lines[] = "- {$category}:";
            foreach (array_slice(array_filter($catalog['products'], fn ($p) => $p['category'] === $category), 0, 20) as $p) {
                $status = $p['status'] === 'UNAVAILABLE' ? ' غير متوفر' : '';
                $extras = $p['extras'] ? ' | إضافات: '.implode('، ', $p['extras']) : '';
                $lines[] = "  - {$p['name_ar']} | {$p['price']} {$p['currency']}{$status}{$extras}";
            }
        }

        $lines[] = $contact
            ? "إذا لم تجد الإجابة بدقة في البيانات، لا تخمّن. قل ذلك بجملة قصيرة ثم اكتب هذا السطر حرفياً: {$contact}"
            : 'إذا لم تجد الإجابة، قل ذلك بوضوح واطلب من الزبون السؤال عن الأصناف أو الأسعار.';

        return mb_substr(implode("\n", $lines), 0, 12000);
    }

    /** OpenAI compatible chat completion; null when not configured or on any failure. */
    private function completeWithLlm(string $system, array $messages): ?string
    {
        $key = config('menuhub.chatbot.api_key');
        if (! $key) {
            return null;
        }

        try {
            $response = Http::withToken($key)->timeout(20)->acceptJson()
                ->post(config('menuhub.chatbot.base_url').'/chat/completions', [
                    'model' => config('menuhub.chatbot.model'),
                    'temperature' => 0.3,
                    'max_tokens' => 400,
                    'messages' => [['role' => 'system', 'content' => $system], ...$messages],
                ]);

            if (! $response->successful()) {
                return null;
            }

            return trim((string) $response->json('choices.0.message.content')) ?: null;
        } catch (\Throwable $e) {
            Log::warning('chatbot LLM request failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function withContactIfNeeded(string $reply, array $catalog, array $products, bool $unknown): array
    {
        $uncertain = T::looksLike($reply, '/(لا اعرف|لا اعلم|ليس لدي|لم اجد|ما عندي|ما قدرت|غير متوفر في|لا املك معلومه|لا يمكنني التاكد|لا توجد لدي معلومات)/');

        if (! $unknown && ! $uncertain) {
            return ['reply' => $reply, 'products' => $products];
        }

        $contact = $this->answerer->contact($catalog);
        $help = $this->answerer->contactLine($catalog);
        $already = $help ? str_contains($reply, $contact['display'] ?? "\0") : true;

        return [
            'reply' => $help && ! $already ? trim($reply)."\n{$help} لنساعدك مباشرة." : $reply,
            'products' => $products,
            'contact' => $contact,
            'unknown' => true,
            'suggestions' => CatalogAnswerer::SUGGESTIONS,
        ];
    }
}
