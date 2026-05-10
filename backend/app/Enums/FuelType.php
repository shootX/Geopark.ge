<?php

namespace App\Enums;

enum FuelType: string
{
    case Petrol = 'petrol';
    case Diesel = 'diesel';
    case Hybrid = 'hybrid';
    case Electric = 'electric';
    case Gas = 'gas';
    case PluginHybrid = 'plugin_hybrid';

    public function label(): string
    {
        return match ($this) {
            self::Petrol => 'Petrol',
            self::Diesel => 'Diesel',
            self::Hybrid => 'Hybrid',
            self::Electric => 'Electric',
            self::Gas => 'Gas',
            self::PluginHybrid => 'Plug-in Hybrid',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
