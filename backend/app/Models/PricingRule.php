<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'parking_id',
        'name',
        'description',
        'formula',
        'multiplier',
        'is_active',
        'created_by',
        'valid_from',
        'valid_until',
    ];

    protected function casts(): array
    {
        return [
            'multiplier' => 'float',
            'is_active' => 'boolean',
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
        ];
    }

    public function parking()
    {
        return $this->belongsTo(Parking::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function logs()
    {
        return $this->hasMany(PricingLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForParking($query, int $parkingId)
    {
        return $query->where('parking_id', $parkingId);
    }

    public function scopeValid($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('valid_from')->orWhere('valid_from', '<=', now());
        })->where(function ($q) {
            $q->whereNull('valid_until')->orWhere('valid_until', '>=', now());
        });
    }

    public function getIsValidAttribute(): bool
    {
        $now = now();
        if ($this->valid_from && $this->valid_from->gt($now)) return false;
        if ($this->valid_until && $this->valid_until->lt($now)) return false;
        return true;
    }
}
