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
        Schema::create('discovery_queue', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address');
            $table->boolean('is_alive')->default(false);
            $table->boolean('snmp_available')->default(false);
            $table->text('sys_descr')->nullable();       // Device description
            $table->text('sys_name')->nullable();        // Unit / hostname
            $table->text('sys_contact')->nullable();     // Responsible user
            $table->string('sys_object_id')->nullable();
            $table->text('sys_location')->nullable();    // Department / location
            $table->timestamp('discovered_at');
            $table->string('discovery_status')->default('pending'); // pending, processed, failed
            $table->text('error_message')->nullable();
        
            $table->timestamps();
        
            $table->index(['ip_address']);
            $table->index(['discovery_status']);
            $table->index(['discovered_at']);
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discovery_queue');
    }
};
