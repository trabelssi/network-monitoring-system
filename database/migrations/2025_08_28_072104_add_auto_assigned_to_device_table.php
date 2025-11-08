<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('device', function (Blueprint $table) {
            $table->boolean('auto_assigned')->default(false)->comment('Whether device was auto-assigned or manually assigned');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('device', function (Blueprint $table) {
            $table->dropColumn('auto_assigned');
        });
    }
};
