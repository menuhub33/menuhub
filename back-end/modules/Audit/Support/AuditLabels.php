<?php

namespace Modules\Audit\Support;

/**
 * Arabic, human readable text for an `entity.event` audit action.
 */
final class AuditLabels
{
    private const ENTITIES = [
        'restaurant' => 'بيانات النشاط',
        'menu' => 'القائمة',
        'category' => 'قسم',
        'product' => 'منتج',
        'product_image' => 'صورة منتج',
        'product_option_group' => 'مجموعة خيارات',
        'product_option' => 'خيار',
        'restaurant_theme' => 'تصميم المنيو',
        'social_link' => 'رابط تواصل',
        'business_hour' => 'ساعات العمل',
        'branch' => 'فرع',
        'qr_code' => 'رمز QR',
        'custom_domain' => 'نطاق مخصص',
        'staff' => 'عضو فريق',
    ];

    private const EVENTS = [
        'created' => 'إضافة',
        'updated' => 'تعديل',
        'deleted' => 'حذف',
    ];

    public static function describe(string $action): string
    {
        [$entity, $event] = array_pad(explode('.', $action, 2), 2, null);

        $entityLabel = self::ENTITIES[$entity] ?? $entity;
        $eventLabel = self::EVENTS[$event] ?? $event;

        return trim("{$eventLabel} {$entityLabel}");
    }
}
