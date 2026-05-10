<?php

namespace App\Models;

use App\Enums\FuelType;
use App\Enums\VehicleCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserCar extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'brand',
        'model',
        'category',
        'fuel_type',
        'year',
        'plate_number',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'category' => VehicleCategory::class,
            'fuel_type' => FuelType::class,
            'year' => 'integer',
            'is_default' => 'boolean',
        ];
    }

    // ─── Relationships ───

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    // ─── Scopes ───

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByFuelType($query, string $fuelType)
    {
        return $query->where('fuel_type', $fuelType);
    }

    // ─── Methods ───

    /**
     * Set this car as the default for the user.
     * All other cars belonging to the user will have is_default set to false.
     */
    public function setAsDefault(): void
    {
        // Unset default for all other cars of the same user
        static::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Set this car as default
        $this->update(['is_default' => true]);
    }
}
