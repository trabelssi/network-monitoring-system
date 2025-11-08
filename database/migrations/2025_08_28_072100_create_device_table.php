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
        Schema::create('device', function (Blueprint $table) {
            $table->id();
            
            // Basic device identification
            $table->string('hostname')->nullable()->comment('Discovered or manual entry');
            $table->string('ip_address')->unique()->comment('Device IP address');
            
            // Status fields
            $table->boolean('is_alive')->default(false)->comment('Set via ICMP check');
            $table->boolean('snmp_available')->default(false)->comment('Set via SNMP check');
            
            // SNMP discovered information
            $table->text('sys_descr')->nullable()->comment('SNMP sysDescr');
            $table->string('sys_object_id')->nullable()->comment('SNMP sysObjectID');
            $table->string('sys_location')->nullable()->comment('SNMP sysLocation');
            $table->string('sys_contact')->nullable()->comment('SNMP sysContact - System responsible person');
            
            // Organizational relationships
            $table->unsignedBigInteger('department_id')->nullable()->comment('Foreign key to department.id');
            $table->unsignedBigInteger('unit_id')->nullable()->comment('Foreign key to unite_materiel.id');
            
            // Manual assignments
            $table->string('user_name')->nullable()->comment('Manual assigned user');
            $table->string('asset_number')->nullable()->comment('Inventory number');
            
            // Monitoring
            $table->timestamp('last_seen')->nullable()->comment('Last successful ping/SNMP response');
            
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('department_id')->references('id')->on('department')->onDelete('set null');
            $table->foreign('unit_id')->references('id')->on('unite_materiel')->onDelete('set null');
            
            // Indexes for performance
            $table->index('ip_address');
            $table->index('department_id');
            $table->index('unit_id');
            $table->index('is_alive');
            $table->index('last_seen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device');
    }
};
