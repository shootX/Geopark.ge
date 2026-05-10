<?php

namespace App\Enums;

enum ParkingType: string
{
    case Private = 'private';
    case Municipal = 'municipal';

    public function label(): string
    {
        return match ($this) {
            self::Private => 'Private Parking',
            self::Municipal => 'Municipal Parking',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
