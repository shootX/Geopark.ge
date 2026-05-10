<?php

namespace App\Enums;

enum ParkingOfferStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Paused = 'paused';
    case Booked = 'booked';
    case Completed = 'completed';
    case Blocked = 'blocked';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Active => 'Active',
            self::Paused => 'Paused',
            self::Booked => 'Booked',
            self::Completed => 'Completed',
            self::Blocked => 'Blocked',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Active => 'green',
            self::Paused => 'yellow',
            self::Booked => 'blue',
            self::Completed => 'purple',
            self::Blocked => 'red',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Statuses that allow new bookings.
     */
    public function isBookable(): bool
    {
        return $this === self::Active;
    }

    /**
     * Statuses that are visible in marketplace listings.
     */
    public function isListable(): bool
    {
        return in_array($this, [self::Active, self::Booked]);
    }
}
