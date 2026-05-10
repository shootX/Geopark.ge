<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveLocation extends Model
{
    // We don't use timestamps() since we manage updated_at manually
    public $timestamps = false;

    protected $fillable = [
        'booking_id',
        'user_id',
        'latitude',
        'longitude',
        'heading',
        'speed',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'heading' => 'float',
            'speed' => 'float',
        ];
    }

    // ─── Relationships ───

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ───

    public function scopeForBooking($query, int $bookingId)
    {
        return $query->where('booking_id', $bookingId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeRecent($query, int $minutes = 5)
    {
        return $query->where('updated_at', '>=', now()->subMinutes($minutes));
    }

    // ─── Methods ───

    /**
     * Update or create location for a booking/user pair.
     */
    public static function updateLocation(int $bookingId, int $userId, float $latitude, float $longitude, ?float $heading = null, ?float $speed = null): self
    {
        $location = self::updateOrCreate(
            [
                'booking_id' => $bookingId,
                'user_id' => $userId,
            ],
            [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'heading' => $heading,
                'speed' => $speed,
                'updated_at' => now(),
            ]
        );

        return $location;
    }

    /**
     * Calculate the distance between two coordinates using the Haversine formula.
     */
    public static function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Check if a location is within a geofence radius of a target.
     */
    public static function isWithinGeofence(float $currentLat, float $currentLng, float $targetLat, float $targetLng, float $radiusMeters = 100): bool
    {
        $distanceKm = self::calculateDistance($currentLat, $currentLng, $targetLat, $targetLng);
        return ($distanceKm * 1000) <= $radiusMeters;
    }
}
