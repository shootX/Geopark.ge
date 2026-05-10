<?php

namespace App\Events;

use App\Models\Offer;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OfferReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Offer $offer) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->offer->receiver_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'offer.received';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->offer->id,
            'sender_id' => $this->offer->sender_id,
            'booking_id' => $this->offer->booking_id,
            'price_offer' => $this->offer->price_offer,
            'status' => $this->offer->status->value,
        ];
    }
}
