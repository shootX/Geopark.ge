<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfferAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'offer_id',
        'day_of_week',
        'specific_date',
        'from_time',
        'until_time',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'specific_date' => 'date',
            'from_time' => 'datetime:H:i',
            'until_time' => 'datetime:H:i',
            'is_available' => 'boolean',
        ];
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(ParkingOffer::class, 'offer_id');
    }

    /**
     * Check if this availability slot covers a given time range.
     */
    public function covers(Carbon $from, Carbon $until): bool
    {
        $fromTime = $from->format('H:i');
        $untilTime = $until->format('H:i');

        return $fromTime >= $this->from_time->format('H:i')
            && $untilTime <= $this->until_time->format('H:i');
    }

    /**
     * Scope: availability for today (by day_of_week or specific_date).
     */
    public function scopeForDate($query, Carbon $date)
    {
        return $query->where(function ($q) use ($date) {
            $q->where('day_of_week', $date->dayOfWeek)
              ->orWhere('specific_date', $date->toDateString());
        });
    }

    /**
     * Scope: only available slots.
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }
}
