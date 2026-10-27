<?php

namespace Modules\Operations\Providers;

use Modules\Operations\Models\Branch;
use Modules\Operations\Models\BusinessHour;
use Modules\Operations\Models\CustomDomain;
use Modules\Operations\Models\QrCode;
use Modules\Operations\Models\SocialLink;
use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Tenancy\Models\Restaurant;

class OperationsServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Restaurant::resolveRelationUsing('socialLinks', fn (Restaurant $r) => $r->hasMany(SocialLink::class)->orderBy('sort_order'));
        Restaurant::resolveRelationUsing('branches', fn (Restaurant $r) => $r->hasMany(Branch::class));
        Restaurant::resolveRelationUsing('businessHours', fn (Restaurant $r) => $r->hasMany(BusinessHour::class)->orderBy('day_of_week'));
        Restaurant::resolveRelationUsing('qrCodes', fn (Restaurant $r) => $r->hasMany(QrCode::class));
        Restaurant::resolveRelationUsing('customDomains', fn (Restaurant $r) => $r->hasMany(CustomDomain::class));
    }
}
