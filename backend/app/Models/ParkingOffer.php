<?php

namespace App\Models;

use App\Enums\ParkingOfferStatus;
use App\Enums\ParkingType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParkingOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'parking_id',
        'title',
        'description',
        'parking_type',
        'address',
        'latitude',
        'longitude',
        'supported_vehicle_sizes',
        'features',
        'hourly_price',
        'minimum_hours',
        'available_from',
        'available_until',
        'is_active',
        'status',
        'average_rating',
        'total_reviews',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'supported_vehicle_sizes' => 'array',
            'features' => 'array',
            'hourly_price' => 'float',
            'minimum_hours' => 'integer',
            'available_from' => 'datetime:H:i',
            'available_until' => 'datetime:H:i',
            'is_active' => 'boolean',
            'status' => ParkingOfferStatus::class,
            'average_rating' => 'float',
            'total_reviews' => 'integer',
        ];
    }

    // ─── Relationships ───

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function parking(): BelongsTo
    {
        return $this->belongsTo(Parking::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(OfferImage::class, 'offer_id')->orderBy('sort_order');
    }

    public function availability(): HasMany
    {
        return $this->hasMany(OfferAvailability::class, 'offer_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'parking_offer_id');
    }

    // ─── Scopes ───

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('status', ParkingOfferStatus::Active);
    }

    public function scopeBookable($query)
    {
        return $query->active()->where('status', ParkingOfferStatus::Active);
    }

    public function scopeByOwner($query, int $ownerId)
    {
        return $query->where('owner_id', $ownerId);
    }

    public function scopeByParkingType($query, string $type)
    {
        return $query->where('parking_type', $type);
    }

    public function scopeNearby($query, float $latitude, float $longitude, float $radiusKm = 5)
    {
        $haversine = "(6371 * acos(cos(radians($latitude)) * cos(radians(latitude)) * cos(radians(longitude) - radians($longitude)) + sin(radians($latitude)) * sin(radians(latitude))))";

        return $query->select('parking_offers.*', \DB::raw("{$haversine} AS distance"))
            ->whereRaw("{$haversine} <= ?", [$radiusKm])
            ->orderBy('distance');
    }

    public function scopePriceRange($query, ?float $min, ?float $max)
    {
        if ($min !== null) $query->where('hourly_price', '>=', $min);
        if ($max !== null) $query->where('hourly_price', '<=', $max);
        return $query;
    }

    public function scopeSupportsVehicleSize($query, string $vehicleSize)
    {
        return $query->whereJsonContains('supported_vehicle_sizes', $vehicleSize);
    }

    public function scopeHasFeature($query, string $feature)
    {
        return $query->whereJsonContains('features', $feature);
    }

    // ─── Methods ───

    public function activate(): void
    {
        $this->update([
            'status' => ParkingOfferStatus::Active,
            'is_active' => true,
        ]);
    }

    public function pause(): void
    {
        $this->update([
            'status' => ParkingOfferStatus::Paused,
            'is_active' => false,
        ]);
    }

    public function block(): void
    {
        $this->update([
            'status' => ParkingOfferStatus::Blocked,
            'is_active' => false,
        ]);
    }

    public function markAsBooked(): void
    {
        $this->update(['status' => ParkingOfferStatus::Booked]);
    }

    public function markAsCompleted(): void
    {
        $this->update(['status' => ParkingOfferStatus::Completed]);
    }

    /**
     * Calculate total price for a given number of hours.
     */
    public function calculatePrice(float $hours): float
    {
        $hours = max($hours, $this->minimum_hours);
        return round($hours * $this->hourly_price, 2);
    }
}
