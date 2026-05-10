<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ParkingOfferResource;
use App\Http\Resources\RatingResource;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\WalletResource;
use App\Models\ParkingOffer;
use App\Models\Rating;
use App\Models\Transaction;
use App\Models\Wallet;
use App\Services\ParkingOffer\ParkingOfferService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketplaceController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ParkingOfferService $parkingOfferService,
    ) {}

    /**
     * Admin: List all parking offers with full details.
     */
    public function parkingOffers(Request $request): JsonResponse
    {
        $filters = $request->only([
            'owner_id', 'parking_type', 'vehicle_size', 'status',
            'min_price', 'max_price', 'search',
        ]);

        $offers = $this->parkingOfferService->getAll(
            $filters,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'offers' => ParkingOfferResource::collection($offers),
            'meta' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'per_page' => $offers->perPage(),
                'total' => $offers->total(),
                'from' => $offers->firstItem(),
                'to' => $offers->lastItem(),
            ],
        ]);
    }

    /**
     * Admin: List all wallets.
     */
    public function wallets(Request $request): JsonResponse
    {
        $query = Wallet::with('user')
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_direction ?? 'desc');

        if ($request->has('is_blocked')) {
            $query->where('is_blocked', filter_var($request->is_blocked, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = (int) ($request->per_page ?? 15);
        $wallets = $query->paginate($perPage);

        return $this->success([
            'wallets' => WalletResource::collection($wallets),
            'meta' => [
                'current_page' => $wallets->currentPage(),
                'last_page' => $wallets->lastPage(),
                'per_page' => $wallets->perPage(),
                'total' => $wallets->total(),
                'from' => $wallets->firstItem(),
                'to' => $wallets->lastItem(),
            ],
        ]);
    }

    /**
     * Admin: List all escrow transactions.
     */
    public function transactions(Request $request): JsonResponse
    {
        $query = Transaction::with(['booking', 'renter', 'owner'])
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_direction ?? 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('booking_id')) {
            $query->where('booking_id', (int) $request->booking_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = (int) ($request->per_page ?? 15);
        $transactions = $query->paginate($perPage);

        return $this->success([
            'transactions' => TransactionResource::collection($transactions),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'from' => $transactions->firstItem(),
                'to' => $transactions->lastItem(),
            ],
        ]);
    }

    /**
     * Admin: List all ratings.
     */
    public function ratings(Request $request): JsonResponse
    {
        $query = Rating::with(['fromUser', 'toUser', 'booking'])
            ->orderBy($request->sort_by ?? 'created_at', $request->sort_direction ?? 'desc');

        if ($request->has('rating')) {
            $query->where('rating', (int) $request->rating);
        }

        if ($request->has('booking_id')) {
            $query->where('booking_id', (int) $request->booking_id);
        }

        $perPage = (int) ($request->per_page ?? 15);
        $ratings = $query->paginate($perPage);

        return $this->success([
            'ratings' => RatingResource::collection($ratings),
            'meta' => [
                'current_page' => $ratings->currentPage(),
                'last_page' => $ratings->lastPage(),
                'per_page' => $ratings->perPage(),
                'total' => $ratings->total(),
                'from' => $ratings->firstItem(),
                'to' => $ratings->lastItem(),
            ],
        ]);
    }

    /**
     * Admin: Get marketplace dashboard stats.
     */
    public function stats(): JsonResponse
    {
        $activeOffers = ParkingOffer::where('status', 'active')->count();
        $totalOffers = ParkingOffer::count();
        $totalWallets = Wallet::count();
        $blockedWallets = Wallet::where('is_blocked', true)->count();
        $heldTransactions = Transaction::where('status', 'held')->count();
        $totalPlatformFees = Transaction::where('status', 'released')->sum('platform_fee');
        $totalRevenue = Transaction::where('status', 'released')->sum('total_amount');

        return $this->success([
            'active_offers' => $activeOffers,
            'total_offers' => $totalOffers,
            'total_wallets' => $totalWallets,
            'blocked_wallets' => $blockedWallets,
            'held_transactions' => $heldTransactions,
            'total_platform_fees' => round($totalPlatformFees, 2),
            'total_revenue' => round($totalRevenue, 2),
        ]);
    }
}
