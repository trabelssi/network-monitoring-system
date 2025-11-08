<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class SnmpServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Configure SNMP settings globally to suppress MIB warnings
        if (extension_loaded('snmp')) {
            // Set SNMP MIB directory
            if (is_dir('c:/usr/share/snmp/mibs')) {
                putenv('MIBDIRS=c:/usr/share/snmp/mibs');
            }
            
            // Set default SNMP options
            @snmp_set_quick_print(true);
            @snmp_set_valueretrieval(SNMP_VALUE_PLAIN);
            @snmp_set_oid_output_format(SNMP_OID_OUTPUT_NUMERIC);
            
            // Suppress MIB warnings by reducing verbosity
            if (function_exists('snmp_set_enum_print')) {
                @snmp_set_enum_print(false);
            }
        }
    }
}
