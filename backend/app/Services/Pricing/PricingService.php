<?php

namespace App\Services\Pricing;

use App\Helpers\PricingHelper;
use App\Models\Parking;
use App\Models\PricingRule;
use App\Repositories\PricingRuleRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class PricingService
{
    public function __construct(
        private PricingRuleRepository $pricingRuleRepository,
    ) {}

    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->pricingRuleRepository->getAll($filters, $perPage);
    }

    public function findById(int $id): ?PricingRule
    {
        return $this->pricingRuleRepository->findById($id);
    }

    public function create(array $data, int $userId): PricingRule
    {
        $data['created_by'] = $userId;
        return $this->pricingRuleRepository->create($data);
    }

    public function update(PricingRule $rule, array $data): PricingRule
    {
        return $this->pricingRuleRepository->update($rule, $data);
    }

    public function delete(PricingRule $rule): bool
    {
        return $this->pricingRuleRepository->delete($rule);
    }

    public function getActiveForParking(int $parkingId): ?PricingRule
    {
        return $this->pricingRuleRepository->getActiveForParking($parkingId);
    }

    public function calculatePrice(int $parkingId, float $hours): array
    {
        $parking = Parking::findOrFail($parkingId);
        $rule = $this->getActiveForParking($parkingId);

        $result = PricingHelper::calculatePrice($parking, $hours, $rule);

        // Log the calculation
        $this->pricingRuleRepository->logCalculation([
            'parking_id' => $parking->id,
            'pricing_rule_id' => $rule?->id,
            'formula' => $result['formula'],
            'variables' => json_encode($result),
            'calculated_price' => $result['price'],
            'base_price' => $result['base_price'],
            'hours' => $result['hours'],
            'demand_factor' => $result['demand_factor'],
            'weekend_multiplier' => $result['weekend_multiplier'],
        ]);

        return $result;
    }

    public function calculateDynamic(int $parkingId, float $hours, string $formula, array $additionalVars = []): array
    {
        $parking = Parking::findOrFail($parkingId);

        $demandFactor = PricingHelper::calculateDemandFactor($parking);
        $weekendMultiplier = now()->isWeekend() ? 1.2 : 1.0;

        $variables = array_merge([
            'base_price' => $parking->base_price ?? 0,
            'hours' => $hours,
            'multiplier' => 1.0,
            'demand_factor' => $demandFactor,
            'demand_multiplier' => $demandFactor,
            'weekend_multiplier' => $weekendMultiplier,
            'hourly_rate' => $parking->base_price ?? 0,
        ], $additionalVars);

        $price = PricingHelper::evaluateFormula($formula, $variables);

        return [
            'price' => round($price, 2),
            'variables' => $variables,
            'formula' => $formula,
            'parking_id' => $parkingId,
            'parking_title' => $parking->title,
        ];
    }

    public function getLogs(int $parkingId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->pricingRuleRepository->getLogs($parkingId, $perPage);
    }

    public function validateFormula(string $formula): bool
    {
        try {
            $result = PricingHelper::evaluateFormula($formula, [
                'base_price' => 10,
                'hours' => 3,
                'multiplier' => 1.0,
                'demand_factor' => 1.0,
                'demand_multiplier' => 1.0,
                'weekend_multiplier' => 1.0,
                'hourly_rate' => 10,
            ]);
            return is_numeric($result) && $result >= 0;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
