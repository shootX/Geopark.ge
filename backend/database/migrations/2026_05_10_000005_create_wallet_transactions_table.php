<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('wallets')->cascadeOnDelete();
            $table->string('type'); // deposit, withdrawal, booking_payment, booking_income, platform_fee, refund
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_before', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->string('reference_type')->nullable(); // booking, deposit, withdrawal
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('status')->default('completed'); // pending, completed, failed
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('wallet_id');
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
