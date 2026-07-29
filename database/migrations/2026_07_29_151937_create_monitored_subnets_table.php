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
        Schema::create('monitored_subnets', function (Blueprint $table) {
            $table->id();
            $table->string('subnet', 100)->unique()->comment('CIDR notation (e.g., 192.168.1.0/24)');
            $table->string('name', 255)->comment('Human-readable name (e.g., Office network)');
            $table->boolean('enabled')->default(true)->comment('Whether this subnet is actively monitored');
            $table->timestamps();
            
            $table->index('enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monitored_subnets');
    }
};
