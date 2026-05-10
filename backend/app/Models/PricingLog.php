<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'pricing_rule_id',
        'parking_id',
        'formula',
        'variables',
        'calculated_price',
        'base_price',
        'hours',
        'demand_factor',
        'weekend_multiplier',
        'booking_id',
        'calculated_by',
    ];

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'calculated_price' => 'float',
            'base_price' => 'float',
            'hours' => 'float',
            'demand_factor' => 'float',
            'weekend_multiplier' => 'float',
        ];
    }

    public function pricingRule()
    {
        return $this->belongsTo(PricingRule::class);
    }

    public function parking()
    {
        return $this->belongsTo(Parking::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function calculator()
    {
        return $this->belongsTo(User::class, 'calculated_by');
    }
}
