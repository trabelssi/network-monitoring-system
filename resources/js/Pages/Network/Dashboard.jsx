import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ComputerDesktopIcon,
    BuildingOfficeIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    CpuChipIcon,
    GlobeAltIcon,
    ChartBarIcon,
    WrenchIcon,
    PlusIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    BoltIcon,
    SignalIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function NetworkDashboard({ 
    auth, 
    stats, 
    unknownDevices, 
    recentDiscoveries, 
    departmentBreakdown,
    networkTopology
}) {
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedSubnet, setSelectedSubnet] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [animateStats, setAnimateStats] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);

    // Simulate loading and animate stats on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
            setAnimateStats(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Animate stats counting up
    const [animatedStats, setAnimatedStats] = useState({
        total_devices: 0,
        online_devices: 0,
        offline_devices: 0,
        unknown_devices: 0,
        auto_assigned_devices: 0,
        departments_count: 0,
        equipment_units_count: 0
    });

    useEffect(() => {
        if (animateStats && stats) {
            const duration = 2000; // 2 seconds
            const steps = 60;
            const stepDuration = duration / steps;
            
            let currentStep = 0;
            const interval = setInterval(() => {
                currentStep++;
                const progress = currentStep / steps;
                
                setAnimatedStats({
                    total_devices: Math.floor((stats.total_devices || 0) * progress),
                    online_devices: Math.floor((stats.online_devices || 0) * progress),
                    offline_devices: Math.floor((stats.offline_devices || 0) * progress),
                    unknown_devices: Math.floor((stats.unknown_devices || 0) * progress),
                    auto_assigned_devices: Math.floor((stats.auto_assigned_devices || 0) * progress),
                    departments_count: Math.floor((stats.departments_count || 0) * progress),
                    equipment_units_count: Math.floor((stats.equipment_units_count || 0) * progress)
                });
                
                if (currentStep >= steps) {
                    clearInterval(interval);
                    setAnimatedStats({
                        total_devices: stats.total_devices || 0,
                        online_devices: stats.online_devices || 0,
                        offline_devices: stats.offline_devices || 0,
                        unknown_devices: stats.unknown_devices || 0,
                        auto_assigned_devices: stats.auto_assigned_devices || 0,
                        departments_count: stats.departments_count || 0,
                        equipment_units_count: stats.equipment_units_count || 0
                    });
                }
            }, stepDuration);
            
            return () => clearInterval(interval);
        }
    }, [animateStats, stats]);

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Chargement du tableau de bord réseau...</div>
                        <div className="text-gray-400 mt-2">Découverte des appareils et analyse de la topologie réseau</div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg animate-pulse">
                            <ChartBarIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 animate-fade-in-up">Gestion Réseau</p>
                            <h2 className="text-2xl font-bold text-white animate-fade-in-up animation-delay-100">
                        Tableau de Bord Réseau - Société Sancella
                    </h2>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            href={route('devices.index')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-up animation-delay-200"
                        >
                            <WrenchIcon className="w-5 h-5" />
                            Gérer les Appareils
                        </Link>
                        <Link
                            href={route('departments.index')}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-up animation-delay-300"
                        >
                            <BuildingOfficeIcon className="w-5 h-5" />
                            Gérer les Départements
                        </Link>
                        <Link
                            href={route('discovery.index')}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in-up animation-delay-400"
                        >
                            <MagnifyingGlassIcon className="w-5 h-5" />
                            Découverte d'Appareils
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Tableau de Bord Réseau" />
            
            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Network Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
                                hoveredCard === 'total' ? 'ring-2 ring-cyan-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('total')}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{ animationDelay: '0ms' }}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <ComputerDesktopIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white transition-all duration-300">
                                        {animatedStats.total_devices}
                                    </div>
                                    <div className="text-gray-400">Total Appareils</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-cyan-400">
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                <span>Réseau Actif</span>
                            </div>
                        </div>
                        
                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer ${
                                hoveredCard === 'online' ? 'ring-2 ring-green-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('online')}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{ animationDelay: '100ms' }}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <CheckCircleIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-400 transition-all duration-300">
                                        {animatedStats.online_devices}
                                    </div>
                                    <div className="text-gray-400">En Ligne ({stats.online_percentage}%)</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-green-400">
                                <SignalIcon className="h-4 w-4 mr-1 animate-pulse" />
                                <span>Sain</span>
                            </div>
                        </div>
                        
                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-red-500/20 cursor-pointer ${
                                hoveredCard === 'offline' ? 'ring-2 ring-red-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('offline')}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{ animationDelay: '200ms' }}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <XCircleIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-400 transition-all duration-300">
                                        {animatedStats.offline_devices}
                                    </div>
                                    <div className="text-gray-400">Hors Ligne</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-red-400">
                                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                <span>Nécessite Attention</span>
                            </div>
                        </div>
                        
                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-yellow-500/20 cursor-pointer ${
                                hoveredCard === 'unknown' ? 'ring-2 ring-yellow-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('unknown')}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{ animationDelay: '300ms' }}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-400 transition-all duration-300">
                                        {animatedStats.unknown_devices}
                                    </div>
                                    <div className="text-gray-400">Nécessite Classification</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-yellow-400">
                                <BoltIcon className="h-4 w-4 mr-1 animate-bounce" />
                                <span>Action Requise</span>
                            </div>
                        </div>
                    </div>

                    {/* Auto-Assignment Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div 
                            className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-black/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer"
                            style={{ animationDelay: '400ms' }}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <CpuChipIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-400 transition-all duration-300">
                                        {animatedStats.auto_assigned_devices}
                                    </div>
                                    <div className="text-gray-400">Auto-Assignés</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-purple-400">
                                <BoltIcon className="h-4 w-4 mr-1" />
                                <span>Détection Intelligente</span>
                            </div>
                        </div>
                        
                        <div 
                            className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-black/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 cursor-pointer"
                            style={{ animationDelay: '500ms' }}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-indigo-400 transition-all duration-300">
                                        {animatedStats.departments_count}
                                    </div>
                                    <div className="text-gray-400">Départements</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-indigo-400">
                                <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                                <span>Organisés</span>
                            </div>
                        </div>
                        
                        <div 
                            className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-black/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/20 cursor-pointer"
                            style={{ animationDelay: '600ms' }}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <GlobeAltIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-teal-400 transition-all duration-300">
                                        {animatedStats.equipment_units_count}
                                    </div>
                                    <div className="text-gray-400">Unités d'Équipement</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-teal-400">
                                <GlobeAltIcon className="h-4 w-4 mr-1" />
                                <span>Réseau Global</span>
                            </div>
                        </div>
                    </div>

                    {/* Unknown Devices Alert */}
                    {unknownDevices.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm animate-fade-in-up animation-delay-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg mr-3 animate-pulse">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-yellow-400">
                                            {unknownDevices.length} appareils nécessitent une classification manuelle
                                        </h3>
                                        <p className="text-yellow-300">
                                            Ces appareils ont été découverts mais n'ont pas pu être automatiquement classifiés par plage IP ou type d'appareil.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={route('devices.index', { unknown: true })}
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                >
                                    Classifier Maintenant
                                </Link>
                            </div>
                            

                        </div>
                    )}

                    {/* Department Breakdown */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden animate-fade-in-up animation-delay-800">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-6 text-white">Aperçu Réseau par Département</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {departmentBreakdown.map((department, index) => (
                                    <div
                                        key={department.id}
                                        className="bg-black/20 border border-white/10 rounded-lg p-4 hover:bg-black/30 hover:shadow-lg transition-all duration-500 transform hover:scale-105 cursor-pointer backdrop-blur-sm"
                                        onClick={() => setSelectedDepartment(department)}
                                        style={{ animationDelay: `${900 + index * 100}ms` }}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg transition-all duration-300 transform hover:rotate-12">
                                                <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="text-2xl font-bold text-white">
                                                {department.devices_count}
                                            </span>
                                        </div>
                                        
                                        <h4 className="font-semibold text-white mb-2">{department.name}</h4>
                                        
                                        {department.ip_range && (
                                            <div className="text-sm text-gray-400 mb-2">
                                                Réseau: {department.ip_range}
                                            </div>
                                        )}
                                        
                                        <div className="space-y-1">
                                            
                                           
                                            {department.unknown_devices_count > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Inconnus:</span>
                                                    <span className="text-yellow-400 font-medium">
                                                        {department.unknown_devices_count}
                                                    </span>
                                                </div>
                                            )}
                                            
                                        </div>
                                        
                                        {/* Health indicator */}
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Santé Réseau</span>
                                                <span>{department.health_percentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                                        department.health_percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                                        department.health_percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                                                    }`}
                                                    style={{ 
                                                        width: '0%',
                                                        animation: `progressBar 1.5s ease-out ${index * 0.2}s forwards`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        {/* Equipment units */}
                                        {department.equipment_units && department.equipment_units.length > 0 && (
                                            <div className="mt-3">
                                                <div className="text-xs text-gray-400 mb-1">Unités d'Équipement:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {department.equipment_units.map(unit => (
                                                        <span key={unit.id} className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105">
                                                            {unit.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>



                    {/* Recent Discoveries */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden animate-fade-in-up animation-delay-1200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4 text-white">Découvertes Réseau Récentes (24h)</h3>
                            {recentDiscoveries.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/10">
                                        <thead className="bg-black/20">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Appareil</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Adresse IP</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Département</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Équipement</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Statut</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assignation</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Découvert</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-white/10">
                                            {recentDiscoveries.map((device, index) => (
                                                <tr 
                                                    key={device.id} 
                                                    className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                                                    style={{ animationDelay: `${1300 + index * 50}ms` }}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                        {device.hostname}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {device.ip_address}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
                                                            device.department === 'Unknown Department' 
                                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        }`}>
                                                            {device.department === 'Unknown Department' ? 'Département Inconnu' : device.department}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
                                                            device.equipment_unit === 'Unknown Unité Matériel' 
                                                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        }`}>
                                                            {device.equipment_unit === 'Unknown Unité Matériel' ? 'Unité Matériel Inconnue' : device.equipment_unit}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
                                                            device.icmp_status === 'online' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        }`}>
                                                            {device.icmp_status === 'online' ? 'en ligne' : 'hors ligne'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
                                                            device.auto_assigned ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                        }`}>
                                                            {device.auto_assigned ? 'Auto' : 'Manuel'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {new Date(device.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-8">
                                    Aucun appareil découvert dans les dernières 24 heures
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: var(--target-width); }
                }
                
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                }
                
                .animation-delay-100 { animation-delay: 100ms; }
                .animation-delay-200 { animation-delay: 200ms; }
                .animation-delay-300 { animation-delay: 300ms; }
                .animation-delay-700 { animation-delay: 700ms; }
                .animation-delay-800 { animation-delay: 800ms; }
                .animation-delay-1000 { animation-delay: 1000ms; }
                .animation-delay-1200 { animation-delay: 1200ms; }
            `}</style>
        </AuthenticatedLayout>
    );
}
