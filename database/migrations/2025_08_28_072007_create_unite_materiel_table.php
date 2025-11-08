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
        Schema::create('unite_materiel', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to department
            $table->unsignedBigInteger('department_id')->comment('Foreign key to department.id');
            
            // UniteMatériel identification
            $table->string('name')->comment('UniteMatériel name');
            $table->text('description')->nullable()->comment('Optional details about the UniteMatériel');
            $table->text('keywords')->nullable()->comment('Comma-separated keywords for auto-classification');

            $table->timestamps();
            
            // Foreign key constraint
            $table->foreign('department_id')->references('id')->on('department')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('department_id');
            $table->index('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unite_materiel');
    }
};
