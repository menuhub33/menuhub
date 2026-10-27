<?php

namespace Modules\Shared\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * An image reference that was uploaded first: http(s) URL or an app-relative
 * `/images/...` path. `blob:` and `data:` URIs are rejected on purpose.
 */
class ImageUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $value = trim((string) $value);

        if (str_starts_with($value, 'blob:') || str_starts_with($value, 'data:')) {
            $fail('يجب رفع الصورة أولاً قبل الحفظ');

            return;
        }

        if (str_starts_with($value, '/images/') && ! str_starts_with($value, '//')) {
            return;
        }

        $scheme = parse_url($value, PHP_URL_SCHEME);
        if (! in_array($scheme, ['http', 'https'], true) || ! filter_var($value, FILTER_VALIDATE_URL)) {
            $fail('رابط الصورة غير صالح');
        }
    }
}
