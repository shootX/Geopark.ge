<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support CHECK constraints natively in ALTER TABLE
        // MySQL: Add CHECK constraint as safety net
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE parkings ADD CONSTRAINT parkings_available_slots_check CHECK (available_slots >= 0)');
        }

        // Add index to optimize overlapping booking queries
        Schema::table('parkings', function (Blueprint $table) {
            $table->index(['status', 'available_slots'], 'parkings_status_slots_idx');
        });
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE parkings DROP CHECK parkings_available_slots_check');
        }

        Schema::table('parkings', function (Blueprint $table) {
            $table->dropIndex('parkings_status_slots_idx');
        });
    }
};
