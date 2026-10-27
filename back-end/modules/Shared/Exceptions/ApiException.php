<?php

namespace Modules\Shared\Exceptions;

use RuntimeException;

/**
 * Domain error rendered as `{ message, code?, errors? }` with the given status.
 */
class ApiException extends RuntimeException
{
    /**
     * @param  array<string, mixed>|null  $errors
     */
    public function __construct(
        string $message,
        public readonly int $status = 422,
        public readonly ?string $errorCode = null,
        public readonly ?array $errors = null,
    ) {
        parent::__construct($message);
    }

    public static function forbidden(string $message = 'غير مصرح لك بهذا الإجراء', ?string $code = null): self
    {
        return new self($message, 403, $code ?? 'FORBIDDEN');
    }

    public static function notFound(string $message = 'العنصر غير موجود'): self
    {
        return new self($message, 404, 'NOT_FOUND');
    }

    public static function conflict(string $message, ?string $code = null): self
    {
        return new self($message, 409, $code ?? 'CONFLICT');
    }

    public static function invalid(string $message, ?string $code = null): self
    {
        return new self($message, 422, $code ?? 'INVALID');
    }
}
