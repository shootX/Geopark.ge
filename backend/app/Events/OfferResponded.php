<?php

namespace App\Events;

use App\Models\Offer;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OfferResponded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Offer $offer) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->offer->sender_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'offer.responded';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->offer->id,
            'status' => $this->offer->status->value,
            'booking_id' => $this->offer->booking_id,
        ];
    }
}
