<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('parking_offer_id')
                ->nullable()
                ->after('parking_id')
                ->constrained('parking_offers')
                ->nullOnDelete();

            $table->index('parking_offer_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['parking_offer_id']);
            $table->dropColumn('parking_offer_id');
        });
    }
};
