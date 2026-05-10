<?php

namespace App\Models;

use App\Enums\ParkingStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Parking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id', 'title', 'description', 'address', 'latitude', 'longitude',
        'total_slots', 'available_slots', 'base_price', 'images', 'status',
        'opening_time', 'closing_time', 'amenities', 'cancellation_policy', 'is_verified',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'total_slots' => 'integer',
            'available_slots' => 'integer',
            'base_price' => 'float',
            'images' => 'array',
            'amenities' => 'array',
            'status' => ParkingStatus::class,
            'opening_time' => 'datetime:H:i',
            'closing_time' => 'datetime:H:i',
            'is_verified' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function activeBookings()
    {
        return $this->hasMany(Booking::class)->whereIn('booking_status', ['pending', 'approved', 'active']);
    }

    public function pricingRules()
    {
        return $this->hasMany(PricingRule::class);
    }

    public function activePricingRule()
    {
        return $this->hasOne(PricingRule::class)->where('is_active', true)->latest();
    }

    public function pricingLogs()
    {
        return $this->hasMany(PricingLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', ParkingStatus::Active);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeNearby($query, float $latitude, float $longitude, float $radiusKm = 5)
    {
        $haversine = "(6371 * acos(cos(radians($latitude)) * cos(radians(latitude)) * cos(radians(longitude) - radians($longitude)) + sin(radians($latitude)) * sin(radians(latitude))))";

        return $query->select('parkings.*', \DB::raw("{$haversine} AS distance"))
            ->whereRaw("{$haversine} <= ?", [$radiusKm])
            ->orderBy('distance');
    }

    public function scopeAvailable($query)
    {
        return $query->where('available_slots', '>', 0);
    }

    public function scopePriceRange($query, ?float $min, ?float $max)
    {
        if ($min !== null) $query->where('base_price', '>=', $min);
        if ($max !== null) $query->where('base_price', '<=', $max);
        return $query;
    }

    public function scopeSearch($query, ?string $term)
    {
        if ($term) {
            return $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                  ->orWhere('description', 'like', "%{$term}%")
                  ->orWhere('address', 'like', "%{$term}%");
            });
        }
        return $query;
    }

    public function getOccupancyRateAttribute(): float
    {
        if ($this->total_slots <= 0) return 0;
        return round((($this->total_slots - $this->available_slots) / $this->total_slots) * 100, 2);
    }

    public function getIsOpenAttribute(): bool
    {
        if (!$this->opening_time || !$this->closing_time) return true;
        $now = now()->format('H:i');
        return $now >= $this->opening_time->format('H:i') && $now <= $this->closing_time->format('H:i');
    }

    public function updateAvailability(): void
    {
        $activeBookingsCount = $this->activeBookings()->count();
        $this->update(['available_slots' => max(0, $this->total_slots - $activeBookingsCount)]);
    }
}
