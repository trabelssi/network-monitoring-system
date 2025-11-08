<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'website',
        'logo',
        'enterprise_number',
    ];

    protected $table = 'vendors';

    /**
     * Get devices from this vendor
     */
    public function devices()
    {
        return $this->hasMany(Device::class, 'vendor_id');
    }

    /**
     * Get common vendors
     */
    public static function getCommonVendors()
    {
        return [
            [
                'name' => 'Cisco',
                'description' => 'Cisco Systems',
                'website' => 'https://www.cisco.com',
                'enterprise_number' => 9,
            ],
            [
                'name' => 'Juniper',
                'description' => 'Juniper Networks',
                'website' => 'https://www.juniper.net',
                'enterprise_number' => 2636,
            ],
            [
                'name' => 'HP',
                'description' => 'Hewlett-Packard',
                'website' => 'https://www.hp.com',
                'enterprise_number' => 11,
            ],
            [
                'name' => 'Dell',
                'description' => 'Dell Technologies',
                'website' => 'https://www.dell.com',
                'enterprise_number' => 674,
            ],
            [
                'name' => 'Fortinet',
                'description' => 'Fortinet Inc.',
                'website' => 'https://www.fortinet.com',
                'enterprise_number' => 12356,
            ],
            [
                'name' => 'Palo Alto',
                'description' => 'Palo Alto Networks',
                'website' => 'https://www.paloaltonetworks.com',
                'enterprise_number' => 25461,
            ],
            [
                'name' => 'Ubiquiti',
                'description' => 'Ubiquiti Networks',
                'website' => 'https://www.ui.com',
                'enterprise_number' => 10036,
            ],
            [
                'name' => 'Unknown',
                'description' => 'Unknown vendor',
                'website' => null,
                'enterprise_number' => null,
            ],
        ];
    }
} 