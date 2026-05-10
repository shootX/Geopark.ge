<?php

namespace App\Repositories;

use App\Models\PricingRule;
use App\Models\PricingLog;
use Illuminate\Pagination\LengthAwarePaginator;

class PricingRuleRepository
{
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = PricingRule::query()->with(['parking:id,title', 'creator:id,first_name,last_name']);

        if (!empty($filters['parking_id'])) {
            $query->where('parking_id', (int) $filters['parking_id']);
        }

        if (!empty($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        $query->orderBy($filters['sort_by'] ?? 'created_at', $filters['sort_direction'] ?? 'desc');

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?PricingRule
    {
        return PricingRule::with(['parking', 'creator'])->find($id);
    }

    public function create(array $data): PricingRule
    {
        return PricingRule::create($data);
    }

    public function update(PricingRule $rule, array $data): PricingRule
    {
        $rule->update($data);
        return $rule->fresh();
    }

    public function delete(PricingRule $rule): bool
    {
        return $rule->delete();
    }

    public function getActiveForParking(int $parkingId): ?PricingRule
    {
        return PricingRule::forParking($parkingId)->active()->valid()->first();
    }

    public function logCalculation(array $data): PricingLog
    {
        return PricingLog::create($data);
    }

    public function getLogs(int $parkingId, int $perPage = 15): LengthAwarePaginator
    {
        return PricingLog::where('parking_id', $parkingId)
            ->with(['pricingRule', 'booking'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }
}
