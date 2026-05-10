<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\Payment\WalletService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    use ApiResponse;

    public function __construct(
        private WalletService $walletService,
    ) {}

    /**
     * Get wallet balance.
     */
    public function balance(Request $request): JsonResponse
    {
        $balance = $this->walletService->getBalance($request->user());

        return $this->success([
            'balance' => $balance,
            'currency' => 'GEL',
        ]);
    }

    /**
     * Get wallet with full details.
     */
    public function show(Request $request): JsonResponse
    {
        $wallet = $this->walletService->getOrCreateWallet($request->user());

        return $this->success($wallet);
    }

    /**
     * Deposit funds into wallet.
     */
    public function deposit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction = $this->walletService->deposit(
            $request->user(),
            (float) $validated['amount'],
            $validated['description'] ?? null,
        );

        return $this->success($transaction, 'Deposit successful.');
    }

    /**
     * Withdraw funds from wallet.
     */
    public function withdraw(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999.99'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction = $this->walletService->withdraw(
            $request->user(),
            (float) $validated['amount'],
            $validated['description'] ?? null,
        );

        return $this->success($transaction, 'Withdrawal successful.');
    }

    /**
     * Get transaction history.
     */
    public function transactions(Request $request): JsonResponse
    {
        $transactions = $this->walletService->getTransactions(
            $request->user(),
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'transactions' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Admin: Get all wallets.
     */
    public function adminWallets(Request $request): JsonResponse
    {
        $filters = $request->only(['is_blocked', 'min_balance']);

        $wallets = $this->walletService->getAllWallets(
            $filters,
            (int) ($request->per_page ?? 15)
        );

        return $this->success([
            'wallets' => $wallets->items(),
            'meta' => [
                'current_page' => $wallets->currentPage(),
                'last_page' => $wallets->lastPage(),
                'per_page' => $wallets->perPage(),
                'total' => $wallets->total(),
            ],
        ]);
    }

    /**
     * Admin: Block/unblock a wallet.
     */
    public function toggleBlock(Request $request, int $userId): JsonResponse
    {
        $validated = $request->validate([
            'blocked' => ['required', 'boolean'],
        ]);

        $wallet = $this->walletService->setBlocked($userId, (bool) $validated['blocked']);

        return $this->success($wallet, $validated['blocked'] ? 'Wallet blocked.' : 'Wallet unblocked.');
    }

    /**
     * Admin: Get platform revenue stats.
     */
    public function revenue(Request $request): JsonResponse
    {
        $revenue = $this->walletService->getPlatformRevenue();

        return $this->success($revenue);
    }
}
