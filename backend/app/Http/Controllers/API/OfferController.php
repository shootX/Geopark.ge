<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Offer\StoreOfferRequest;
use App\Http\Resources\OfferResource;
use App\Models\Offer;
use App\Services\Offer\OfferService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    use ApiResponse;

    public function __construct(private OfferService $offerService) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'booking_id']);

        if (!$request->user()->isAdmin()) {
            $filters['user_id'] = $request->user()->id;
        }

        $offers = $this->offerService->getAll($filters, (int) ($request->per_page ?? 15));

        return $this->success([
            'offers' => OfferResource::collection($offers),
            'meta' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'per_page' => $offers->perPage(),
                'total' => $offers->total(),
            ],
        ]);
    }

    public function show(Offer $offer): JsonResponse
    {
        $this->authorize('view', $offer);
        return $this->success(new OfferResource($offer->load(['sender', 'receiver', 'booking.parking'])));
    }

    public function store(StoreOfferRequest $request): JsonResponse
    {
        $offer = $this->offerService->send($request->validated(), $request->user());
        return $this->created(new OfferResource($offer), 'Offer sent successfully.');
    }

    public function accept(Request $request, Offer $offer): JsonResponse
    {
        $this->authorize('accept', $offer);
        $offer = $this->offerService->accept($offer, $request->user());
        return $this->success(new OfferResource($offer), 'Offer accepted successfully.');
    }

    public function reject(Request $request, Offer $offer): JsonResponse
    {
        $this->authorize('reject', $offer);
        $offer = $this->offerService->reject($offer, $request->user());
        return $this->success(new OfferResource($offer), 'Offer rejected.');
    }

    public function myOffers(Request $request): JsonResponse
    {
        $offers = $this->offerService->getForUser($request->user()->id);
        return $this->success([
            'offers' => OfferResource::collection($offers),
            'meta' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'total' => $offers->total(),
            ],
        ]);
    }

    public function pendingOffers(Request $request): JsonResponse
    {
        $offers = $this->offerService->getPending($request->user()->id);
        return $this->success([
            'offers' => OfferResource::collection($offers),
            'meta' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'total' => $offers->total(),
            ],
        ]);
    }
}
