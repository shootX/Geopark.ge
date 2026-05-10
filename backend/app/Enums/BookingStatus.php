<?php

namespace App\Enums;

enum BookingStatus: string
{
    // Existing
    case Pending = 'pending';
    case Approved = 'approved';
    case Active = 'active';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    // 🆕 New marketplace states
    case PendingOwnerApproval = 'pending_owner_approval';
    case Rejected = 'rejected';
    case RenterOnTheWay = 'renter_on_the_way';
    case OwnerWaiting = 'owner_waiting';
    case Arrived = 'arrived';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::PendingOwnerApproval => 'Pending Owner Approval',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::RenterOnTheWay => 'Renter On The Way',
            self::OwnerWaiting => 'Owner Waiting',
            self::Arrived => 'Arrived',
            self::Active => 'Active',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
            self::Expired => 'Expired',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'yellow',
            self::PendingOwnerApproval => 'orange',
            self::Approved => 'blue',
            self::Rejected => 'red',
            self::RenterOnTheWay => 'indigo',
            self::OwnerWaiting => 'purple',
            self::Arrived => 'teal',
            self::Active => 'green',
            self::Completed => 'gray',
            self::Cancelled => 'red',
            self::Expired => 'gray',
        };
    }

    /**
     * States where the booking is still in progress and mutable.
     */
    public function isActive(): bool
    {
        return in_array($this, [
            self::Pending,
            self::PendingOwnerApproval,
            self::Approved,
            self::RenterOnTheWay,
            self::OwnerWaiting,
            self::Arrived,
            self::Active,
        ]);
    }

    /**
     * States where the booking is considered finished (terminal).
     */
    public function isTerminal(): bool
    {
        return in_array($this, [
            self::Completed,
            self::Cancelled,
            self::Rejected,
            self::Expired,
        ]);
    }

    /**
     * States where payment escrow is active.
     */
    public function isPaymentHeld(): bool
    {
        return in_array($this, [
            self::Approved,
            self::RenterOnTheWay,
            self::OwnerWaiting,
            self::Arrived,
            self::Active,
        ]);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
