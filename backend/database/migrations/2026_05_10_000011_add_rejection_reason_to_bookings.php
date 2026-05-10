<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('cancellation_reason');
            $table->dateTime('approved_at')->nullable()->after('rejection_reason');
            $table->dateTime('started_at')->nullable()->after('approved_at');
            $table->dateTime('arrived_at')->nullable()->after('started_at');
            $table->dateTime('completed_at')->nullable()->after('arrived_at');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['rejection_reason', 'approved_at', 'started_at', 'arrived_at', 'completed_at']);
        });
    }
};
