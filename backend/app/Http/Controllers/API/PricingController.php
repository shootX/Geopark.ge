<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePricingRuleRequest;
use App\Http\Resources\PricingRuleResource;
use App\Models\Parking;
use App\Models\PricingRule;
use App\Services\Pricing\PricingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PricingController extends Controller
{
    use ApiResponse;

    public function __construct(private PricingService $pricingService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['parking_id', 'is_active', 'search']);
        $rules = $this->pricingService->getAll($filters, (int) ($request->per_page ?? 15));

        return $this->success([
            'rules' => PricingRuleResource::collection($rules),
            'meta' => [
                'current_page' => $rules->currentPage(),
                'last_page' => $rules->lastPage(),
                'per_page' => $rules->perPage(),
                'total' => $rules->total(),
            ],
        ]);
    }

    public function show(PricingRule $pricingRule): JsonResponse
    {
        return $this->success(new PricingRuleResource($pricingRule->load(['parking', 'creator'])));
    }

    public function store(StorePricingRuleRequest $request): JsonResponse
    {
        $rule = $this->pricingService->create($request->validated(), $request->user()->id);
        return $this->created(new PricingRuleResource($rule), 'Pricing rule created successfully.');
    }

    public function update(StorePricingRuleRequest $request, PricingRule $pricingRule): JsonResponse
    {
        $rule = $this->pricingService->update($pricingRule, $request->validated());
        return $this->success(new PricingRuleResource($rule), 'Pricing rule updated successfully.');
    }

    public function destroy(PricingRule $pricingRule): JsonResponse
    {
        $this->pricingService->delete($pricingRule);
        return $this->noContent('Pricing rule deleted successfully.');
    }

    public function calculatePrice(Request $request): JsonResponse
    {
        $request->validate([
            'parking_id' => 'required|integer|exists:parkings,id',
            'hours' => 'required|numeric|min:0.5|max:720',
        ]);

        $result = $this->pricingService->calculatePrice(
            (int) $request->parking_id,
            (float) $request->hours
        );

        return $this->success($result);
    }

    public function calculateDynamic(Request $request): JsonResponse
    {
        $request->validate([
            'parking_id' => 'required|integer|exists:parkings,id',
            'hours' => 'required|numeric|min:0.5',
            'formula' => 'required|string',
        ]);

        $additionalVars = $request->except(['parking_id', 'hours', 'formula']);

        $result = $this->pricingService->calculateDynamic(
            (int) $request->parking_id,
            (float) $request->hours,
            $request->formula,
            $additionalVars
        );

        return $this->success($result);
    }

    public function validateFormula(Request $request): JsonResponse
    {
        $request->validate(['formula' => 'required|string']);

        $isValid = $this->pricingService->validateFormula($request->formula);

        return $this->success([
            'formula' => $request->formula,
            'is_valid' => $isValid,
        ]);
    }

    public function logs(Request $request, Parking $parking): JsonResponse
    {
        $logs = $this->pricingService->getLogs(
            $parking->id,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'logs' => $logs,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
