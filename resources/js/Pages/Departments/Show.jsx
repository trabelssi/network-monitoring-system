import React, { useState, useEffect } from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    BuildingOfficeIcon,
    ComputerDesktopIcon,
    Squares2X2Icon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    BoltIcon,
    SignalIcon
} from '@heroicons/react/24/outline';

export default function Show({ auth, department, deviceStats }) {
    const { delete: destroy } = useForm();
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);

    // Simulate loading and animate content on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le département "${department.name}" ?`)) {
            destroy(route('departments.destroy', department.id), {
                onSuccess: () => {
                    // Redirect to departments index after successful deletion
                }
            });
        }
    };

    const getStatusIcon = (device) => {
        if (device.is_alive) {
            return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
        } else {
            return <XCircleIcon className="h-5 w-5 text-red-400" />;
        }
    };

    const getStatusText = (device) => {
        return device.is_alive ? 'En ligne' : 'Hors ligne';
    };

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Department...</div>
                        <div className="text-gray-400 mt-2">Analyzing department structure and devices</div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center">
                        <Link
                            href={route('departments.index')}
                            className="mr-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                        >
                            <ArrowLeftIcon className="h-5 w-5 text-white" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                                <BuildingOfficeIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Department Details</p>
                                <h2 className="text-2xl font-bold text-white">
                                    Département: {department.name}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            href={route('departments.edit', department.id)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                            Modifier
                        </Link>
                        <button
                            onClick={handleDelete}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <TrashIcon className="w-5 h-5" />
                            Supprimer
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Département: ${department.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    {/* Department Info */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{department.name}</h3>
                                    {department.description && (
                                        <p className="text-gray-400 mt-1">{department.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-center backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <ComputerDesktopIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-blue-400">{deviceStats.total}</div>
                                    <div className="text-sm text-gray-400">Total Appareils</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-blue-400">
                                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                        <span>Connected</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-center backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <CheckCircleIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-green-400">{deviceStats.online}</div>
                                    <div className="text-sm text-gray-400">En ligne</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-green-400">
                                        <SignalIcon className="h-3 w-3 mr-1" />
                                        <span>Healthy</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-center backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <Squares2X2Icon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                    <div className="text-2xl font-bold text-purple-400">{department.uniteMateriels?.length || 0}</div>
                                    <div className="text-sm text-gray-400">Unités Matériel</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-purple-400">
                                        <BoltIcon className="h-3 w-3 mr-1" />
                                        <span>Organized</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Units Material */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg mr-2">
                                    <Squares2X2Icon className="h-5 w-5 text-white" />
                                </div>
                                Unités Matériel ({department.uniteMateriels?.length || 0})
                            </h4>
                            
                            {(!department.uniteMateriels || department.uniteMateriels.length === 0) ? (
                                <div className="text-center py-8">
                                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <Squares2X2Icon className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-gray-400">Aucune unité matériel dans ce département.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {department.uniteMateriels.map((unite) => (
                                        <div 
                                            key={unite.id} 
                                            className={`border border-white/10 rounded-lg p-4 bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                                                hoveredCard === unite.id ? 'ring-2 ring-purple-500/50' : ''
                                            }`}
                                            onMouseEnter={() => setHoveredCard(unite.id)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-medium text-white">{unite.name}</h5>
                                                <span className="text-sm text-blue-400 font-medium">
                                                    {unite.devices.length} appareil(s)
                                                </span>
                                            </div>
                                            {unite.description && (
                                                <p className="text-sm text-gray-400 mb-3">{unite.description}</p>
                                            )}
                                            
                                            {/* Devices in this unit */}
                                            {unite.devices.length > 0 && (
                                                <div className="space-y-2">
                                                    <h6 className="text-xs font-medium text-gray-300 uppercase tracking-wide">Appareils:</h6>
                                                    {unite.devices.slice(0, 3).map((device) => (
                                                        <div key={device.id} className="flex items-center justify-between text-sm">
                                                            <span className="text-white">{device.hostname}</span>
                                                            <div className="flex items-center">
                                                                {getStatusIcon(device)}
                                                                <span className="ml-1 text-xs text-gray-400">
                                                                    {getStatusText(device)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {unite.devices.length > 3 && (
                                                        <p className="text-xs text-gray-500">
                                                            ... et {unite.devices.length - 3} autres
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Devices in Department */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-2">
                                    <ComputerDesktopIcon className="h-5 w-5 text-white" />
                                </div>
                                Tous les Appareils ({deviceStats.total})
                            </h4>
                            
                            {(!department.uniteMateriels || department.uniteMateriels.every(unite => !unite.devices || unite.devices.length === 0)) ? (
                                <div className="text-center py-8">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <ComputerDesktopIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-gray-400">Aucun appareil dans ce département.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-white/10">
                                        <thead className="bg-black/20">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Nom d'hôte
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Adresse IP
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Unité Matériel
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Statut
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Dernière vue
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-white/10">
                                            {department.uniteMateriels?.map((unite) =>
                                                unite.devices?.map((device) => (
                                                    <tr 
                                                        key={device.id} 
                                                        className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-white">
                                                                {device.hostname || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-400">
                                                                {device.ip_address || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-white">
                                                                {unite.name}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {getStatusIcon(device)}
                                                                <span className="ml-2 text-sm text-white">
                                                                    {getStatusText(device)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                            {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Jamais'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
