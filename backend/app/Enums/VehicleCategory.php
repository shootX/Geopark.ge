<?php

namespace App\Enums;

enum VehicleCategory: string
{
    case Sedan = 'sedan';
    case Suv = 'suv';
    case Coupe = 'coupe';
    case Hatchback = 'hatchback';
    case Universal = 'universal';
    case Pickup = 'pickup';
    case Minivan = 'minivan';
    case Van = 'van';
    case Cabrio = 'cabrio';
    case Sport = 'sport';
    case Electric = 'electric';
    case HybridCar = 'hybrid_car';
    case Motorcycle = 'motorcycle';
    case Truck = 'truck';

    public function label(): string
    {
        return match ($this) {
            self::Sedan => 'Sedan',
            self::Suv => 'SUV',
            self::Coupe => 'Coupe',
            self::Hatchback => 'Hatchback',
            self::Universal => 'Universal',
            self::Pickup => 'Pickup',
            self::Minivan => 'Minivan',
            self::Van => 'Van',
            self::Cabrio => 'Cabrio',
            self::Sport => 'Sport',
            self::Electric => 'Electric',
            self::HybridCar => 'Hybrid',
            self::Motorcycle => 'Motorcycle',
            self::Truck => 'Truck',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
