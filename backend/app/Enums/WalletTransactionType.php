<?php

namespace App\Enums;

enum WalletTransactionType: string
{
    case Deposit = 'deposit';
    case Withdrawal = 'withdrawal';
    case BookingPayment = 'booking_payment';
    case BookingIncome = 'booking_income';
    case PlatformFee = 'platform_fee';
    case Refund = 'refund';

    public function label(): string
    {
        return match ($this) {
            self::Deposit => 'Deposit',
            self::Withdrawal => 'Withdrawal',
            self::BookingPayment => 'Booking Payment',
            self::BookingIncome => 'Booking Income',
            self::PlatformFee => 'Platform Fee',
            self::Refund => 'Refund',
        };
    }

    public function isCredit(): bool
    {
        return in_array($this, [
            self::Deposit,
            self::BookingIncome,
            self::Refund,
        ]);
    }

    public function isDebit(): bool
    {
        return in_array($this, [
            self::Withdrawal,
            self::BookingPayment,
            self::PlatformFee,
        ]);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
