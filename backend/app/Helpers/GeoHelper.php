<?php

namespace App\Helpers;

class GeoHelper
{
    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    public static function haversineDistance(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2,
        string $unit = 'km'
    ): float {
        $earthRadius = match ($unit) {
            'mi' => 3959,
            'm' => 6371000,
            default => 6371,
        };

        $latDiff = deg2rad($lat2 - $lat1);
        $lonDiff = deg2rad($lon2 - $lon1);

        $a = sin($latDiff / 2) ** 2 +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lonDiff / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    /**
     * Get bounding box coordinates for a given center point and radius (km)
     */
    public static function boundingBox(float $latitude, float $longitude, float $radiusKm): array
    {
        $latChange = rad2deg($radiusKm / 6371);
        $lonChange = rad2deg($radiusKm / 6371 / cos(deg2rad($latitude)));

        return [
            'min_lat' => $latitude - $latChange,
            'max_lat' => $latitude + $latChange,
            'min_lng' => $longitude - $lonChange,
            'max_lng' => $longitude + $lonChange,
        ];
    }

    /**
     * Check if coordinates are within a given radius
     */
    public static function withinRadius(
        float $lat1,
        float $lon1,
        float $lat2,
        float $lon2,
        float $radiusKm
    ): bool {
        return self::haversineDistance($lat1, $lon1, $lat2, $lon2) <= $radiusKm;
    }
}
