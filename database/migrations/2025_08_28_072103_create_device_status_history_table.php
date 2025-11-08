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
        Schema::create('device_status_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('device_id');
            $table->enum('status', ['online', 'offline'])->comment('Device status when changed');
            $table->timestamp('changed_at')->comment('When the status changed');
            $table->timestamps();
            
            // Foreign key constraint
            $table->foreign('device_id')->references('id')->on('device')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('device_id');
            $table->index('status');
            $table->index('changed_at');
            $table->index(['device_id', 'changed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_status_history');
    }
};
