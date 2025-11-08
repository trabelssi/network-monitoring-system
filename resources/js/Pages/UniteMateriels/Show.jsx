import React, { useState, useEffect } from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    Squares2X2Icon,
    ComputerDesktopIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowTrendingUpIcon,
    BoltIcon,
    SignalIcon
} from '@heroicons/react/24/outline';

export default function Show({ auth, uniteMatériel }) {
    const { delete: destroy } = useForm();
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);

    // Early return if uniteMatériel is not available
    if (!uniteMatériel || !uniteMatériel.id) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Unit Details...</div>
                        <div className="text-gray-400 mt-2">Retrieving material unit information</div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // Simulate loading and animate content on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = () => {
        if ((uniteMatériel.devices || []).length > 0) {
            alert('Impossible de supprimer une unité matériel contenant des appareils.');
            return;
        }
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'unité matériel "${uniteMatériel.name}" ?`)) {
            destroy(route('unite-materiels.destroy', { unite_materiel: uniteMatériel.id }), {
                onSuccess: () => {
                    // Redirect to units index after successful deletion
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

    const onlineDevices = (uniteMatériel.devices || []).filter(device => device.is_alive);
    const offlineDevices = (uniteMatériel.devices || []).filter(device => !device.is_alive);

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Unit Details...</div>
                        <div className="text-gray-400 mt-2">Retrieving material unit information</div>
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
                            href={route('unite-materiels.index')}
                            className="mr-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                        >
                            <ArrowLeftIcon className="h-5 w-5 text-white" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                                <Squares2X2Icon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Material Unit Details</p>
                                <h2 className="text-2xl font-bold text-white">
                                    Unité Matériel: {uniteMatériel.name}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <Link
                            href={route('unite-materiels.edit', { unite_materiel: uniteMatériel.id })}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                            Modifier
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={(uniteMatériel.devices || []).length > 0}
                            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg font-semibold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                                (uniteMatériel.devices || []).length > 0
                                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white focus:ring-red-500'
                            }`}
                            title={(uniteMatériel.devices || []).length > 0 ? 'Impossible de supprimer une unité contenant des appareils' : 'Supprimer cette unité'}
                        >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Supprimer
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={`Unité Matériel: ${uniteMatériel.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    {/* Unit Info */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <Squares2X2Icon className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white">{uniteMatériel.name}</h3>
                                    {uniteMatériel.description && (
                                        <p className="text-gray-400 mt-1">{uniteMatériel.description}</p>
                                    )}
                                    {uniteMatériel.keywords && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {uniteMatériel.keywords_array?.map((keyword, index) => (
                                                <span 
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                >
                                                    {keyword.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Department Link */}
                                <div className="flex items-center bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-2">
                                        <BuildingOfficeIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">Département</div>
                                        {uniteMatériel.department ? (
                                            <Link
                                                href={route('departments.show', uniteMatériel.department.id)}
                                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300"
                                            >
                                                {uniteMatériel.department.name}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400">Non assigné</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-center backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mx-auto mb-2 w-12 h-12 flex items-center justify-center">
                                        <ComputerDesktopIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-blue-400">{(uniteMatériel.devices || []).length}</div>
                                    <div className="text-sm text-gray-400">Total Appareils</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-blue-400">
                                        <SignalIcon className="h-3 w-3 mr-1" />
                                        <span>Connected</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-center backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg mx-auto mb-2 w-12 h-12 flex items-center justify-center">
                                        <CheckCircleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-green-400">{onlineDevices.length}</div>
                                    <div className="text-sm text-gray-400">En ligne</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-green-400">
                                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                        <span>Active</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 text-center backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg mx-auto mb-2 w-12 h-12 flex items-center justify-center">
                                        <XCircleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-red-400">{offlineDevices.length}</div>
                                    <div className="text-sm text-gray-400">Hors ligne</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-red-400">
                                        <BoltIcon className="h-3 w-3 mr-1" />
                                        <span>Attention</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Devices List */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3">
                                    <ComputerDesktopIcon className="h-6 w-6 text-white" />
                                </div>
                                Appareils ({(uniteMatériel.devices || []).length})
                            </h4>
                            
                            {(uniteMatériel.devices || []).length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                        <ComputerDesktopIcon className="h-10 w-10 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Aucun appareil
                                    </h3>
                                    <p className="text-gray-400 mb-6">
                                        Cette unité matériel ne contient pas encore d'appareils.
                                    </p>
                                    <Link
                                        href={route('devices.create')}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-flex items-center gap-2"
                                    >
                                        <ComputerDesktopIcon className="w-5 h-5" />
                                        Ajouter un appareil
                                    </Link>
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
                                                    Statut
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Numéro d'actif
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Dernière vue
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent divide-y divide-white/10">
                                            {(uniteMatériel.devices || []).map((device) => (
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
                                                        <div className="flex items-center">
                                                            {getStatusIcon(device)}
                                                            <span className={`ml-2 text-sm font-medium ${
                                                                device.is_alive ? 'text-green-400' : 'text-red-400'
                                                            }`}>
                                                                {getStatusText(device)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {device.asset_number || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Jamais'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <Link
                                                            href={route('devices.show', device.id)}
                                                            className="text-blue-400 hover:text-blue-300 mr-3 transition-colors duration-300"
                                                        >
                                                            Voir
                                                        </Link>
                                                        <Link
                                                            href={route('devices.edit', device.id)}
                                                            className="text-indigo-400 hover:text-indigo-300 transition-colors duration-300"
                                                        >
                                                            Modifier
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
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
