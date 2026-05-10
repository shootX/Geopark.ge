<?php

namespace App\Http\Controllers\API\User;

use App\Http\Controllers\Controller;
use App\Services\Notification\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    public function __construct(private NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getUserNotifications(
            $request->user(),
            (int) ($request->per_page ?? 20)
        );

        return $this->success([
            'notifications' => $notifications->items(),
            'unread_count' => $this->notificationService->getUnreadCount($request->user()),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function unread(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getUnreadNotifications($request->user());

        return $this->success([
            'notifications' => $notifications->items(),
            'unread_count' => $notifications->total(),
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $this->notificationService->markAsRead($request->user(), $id);
        return $this->success(null, 'Notification marked as read.');
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $this->notificationService->markAllAsRead($request->user());
        return $this->success(null, 'All notifications marked as read.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->notificationService->deleteNotification($request->user(), $id);
        return $this->noContent('Notification deleted.');
    }

    public function clearAll(Request $request): JsonResponse
    {
        $this->notificationService->clearAll($request->user());
        return $this->noContent('All notifications cleared.');
    }

    public function count(Request $request): JsonResponse
    {
        return $this->success([
            'unread_count' => $this->notificationService->getUnreadCount($request->user()),
        ]);
    }
}
