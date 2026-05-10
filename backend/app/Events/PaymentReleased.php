<?php

namespace App\Events;

use App\Models\Booking;
use App\Models\Transaction;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentReleased implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Booking $booking,
        public Transaction $transaction,
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('user.' . $this->booking->user_id),
            new PrivateChannel('booking.' . $this->booking->id),
        ];

        $owner = $this->booking->getOwner();
        if ($owner) {
            $channels[] = new PrivateChannel('user.' . $owner->id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.released';
    }

    public function broadcastWith(): array
    {
        return [
            'booking_id' => $this->booking->id,
            'transaction_id' => $this->transaction->id,
            'status' => $this->transaction->status->value,
            'owner_amount' => $this->transaction->owner_amount,
            'platform_fee' => $this->transaction->platform_fee,
        ];
    }
}
