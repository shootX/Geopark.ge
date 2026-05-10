<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Held = 'held';
    case Released = 'released';
    case Refunded = 'refunded';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Held => 'Funds Held',
            self::Released => 'Released to Owner',
            self::Refunded => 'Refunded to Renter',
            self::Failed => 'Failed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Held => 'blue',
            self::Released => 'green',
            self::Refunded => 'purple',
            self::Failed => 'red',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
