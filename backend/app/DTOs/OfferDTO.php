<?php

namespace App\DTOs;

readonly class OfferDTO
{
    public function __construct(
        public int $receiverId,
        public int $bookingId,
        public string $message,
        public float $priceOffer,
    ) {}

    public static function fromRequest(array $data, ?int $senderId = null): self
    {
        return new self(
            receiverId: (int) $data['receiver_id'],
            bookingId: (int) $data['booking_id'],
            message: $data['message'],
            priceOffer: (float) $data['price_offer'],
        );
    }

    public function toArray(): array
    {
        return [
            'receiver_id' => $this->receiverId,
            'booking_id' => $this->bookingId,
            'message' => $this->message,
            'price_offer' => $this->priceOffer,
        ];
    }
}
