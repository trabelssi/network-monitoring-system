import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ArrowLeftIcon,
    FunnelIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ComputerDesktopIcon,
    BuildingOfficeIcon,
    UserIcon,
    ClockIcon,
    SignalIcon
} from '@heroicons/react/24/outline';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('DeviceHistoryShow Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <AuthenticatedLayout user={this.props.auth?.user}>
                    <div className="py-12">
                        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl">
                                <div className="p-6 text-center">
                                    <h2 className="text-lg font-medium text-white mb-2">Quelque chose s'est mal passé</h2>
                                    <p className="text-gray-400 mb-4">Il y a eu une erreur lors du chargement de l'historique de l'appareil.</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
                                    >
                                        Recharger la Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </AuthenticatedLayout>
            );
        }

        return this.props.children;
    }
}

function DeviceHistoryShowComponent({ auth, device, history = {}, filters = {}, stats = {} }) {
    // Ensure filters is an object, not an array
    const safeFilters = Array.isArray(filters) ? {} : (filters || {});

    const [selectedStatus, setSelectedStatus] = useState(safeFilters?.status || '');
    const [dateFrom, setDateFrom] = useState(safeFilters?.date_from || '');
    const [dateTo, setDateTo] = useState(safeFilters?.date_to || '');
    const [sortField, setSortField] = useState(safeFilters?.sort || 'changed_at');
    const [sortDirection, setSortDirection] = useState(safeFilters?.direction || 'desc');
    const [hoveredCard, setHoveredCard] = useState(null);

    // Ensure history has proper structure with defaults
    const historyData = Array.isArray(history?.data) ? history.data : [];
    const historyLinks = Array.isArray(history?.links) ? history.links : [];
    const historyFrom = typeof history?.from === 'number' ? history.from : 0;
    const historyTo = typeof history?.to === 'number' ? history.to : 0;
    const historyTotal = typeof history?.total === 'number' ? history.total : 0;
    const historyPrevPageUrl = history?.prev_page_url || null;
    const historyNextPageUrl = history?.next_page_url || null;

    // Ensure device has proper structure
    const deviceData = device || {};
    const deviceId = deviceData?.id;
    const deviceHostname = deviceData?.hostname || deviceData?.ip_address || 'Unknown Device';

    // Helper function to validate URLs
    const isValidUrl = (url) => {
        return url && typeof url === 'string' && url.trim() !== '';
    };

    const applyFilters = () => {
        if (!deviceId || typeof router === 'undefined' || typeof route === 'undefined') return;
        router.get(route('device.history.show', deviceId), {
            status: selectedStatus,
            date_from: dateFrom,
            date_to: dateTo,
            sort: sortField,
            direction: sortDirection,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setSelectedStatus('');
        setDateFrom('');
        setDateTo('');
        setSortField('changed_at');
        setSortDirection('desc');
        
        if (!deviceId || typeof router === 'undefined' || typeof route === 'undefined') return;
        router.get(route('device.history.show', deviceId), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field) => {
        const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        
        if (!deviceId || typeof router === 'undefined' || typeof route === 'undefined') return;
        const currentFilters = safeFilters;
        router.get(route('device.history.show', deviceId), {
            ...currentFilters,
            sort: field,
            direction: newDirection,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusIcon = (status) => {
        return status === 'online' ? (
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
        ) : (
            <XCircleIcon className="h-5 w-5 text-red-400" />
        );
    };

    const getStatusColor = (status) => {
        return status === 'online' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30';
    };

    const getCurrentStatusColor = (status) => {
        return status === 'online' ? 'text-green-400' : 'text-red-400';
    };

    // Add loading state and error handling
    if (!deviceData) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl">
                            <div className="p-6 text-center">
                                <p className="text-gray-400">Loading device information...</p>
                            </div>
                        </div>
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
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <ClockIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Historique Statut Appareil</p>
                            <h2 className="text-2xl font-bold text-white">Historique Appareil: {deviceHostname}</h2>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        {deviceId && typeof route === 'function' && isValidUrl(route('devices.show', deviceId)) && (
                            <Link
                                href={route('devices.show', deviceId)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                                Retour à l'Appareil
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Historique Appareil - ${deviceHostname}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Device Info Card */}
                    <div 
                        className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
                            hoveredCard === 'deviceInfo' ? 'ring-2 ring-cyan-500/50' : ''
                        }`}
                        onMouseEnter={() => setHoveredCard('deviceInfo')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                                        <ComputerDesktopIcon className="h-5 w-5 text-white" />
                                    </div>
                                    Informations Appareil
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Nom d'hôte:</span>
                                        <span className="ml-2 text-sm text-white">
                                            {deviceData?.hostname || 'Non défini'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Adresse IP:</span>
                                        <span className="ml-2 text-sm text-white">{deviceData?.ip_address || 'Non défini'}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Statut Actuel:</span>
                                        <span className={`ml-2 text-sm font-medium ${getCurrentStatusColor(stats?.current_status || 'unknown')}`}>
                                            {stats?.current_status === 'online' ? 'en ligne' : stats?.current_status === 'offline' ? 'hors ligne' : 'Inconnu'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-2 rounded-lg">
                                        <BuildingOfficeIcon className="h-5 w-5 text-white" />
                                    </div>
                                    Organisation
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Département:</span>
                                        <span className="ml-2 text-sm text-white">
                                            {deviceData?.department?.name || 'Non assigné'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Unité:</span>
                                        <span className="ml-2 text-sm text-white">
                                            {deviceData?.unite_materiel?.name || 'Non assigné'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Utilisateur:</span>
                                        <span className="ml-2 text-sm text-white">
                                            {deviceData?.user_name || 'Non assigné'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg">
                                        <SignalIcon className="h-5 w-5 text-white" />
                                    </div>
                                    Statistiques
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Total Changements:</span>
                                        <span className="ml-2 text-sm text-white">{stats?.total_changes || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Changements En Ligne:</span>
                                        <span className="ml-2 text-sm text-green-400">{stats?.online_changes || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Changements Hors Ligne:</span>
                                        <span className="ml-2 text-sm text-red-400">{stats?.offline_changes || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-400">Dernier Changement:</span>
                                        <span className="ml-2 text-sm text-white">
                                            {stats?.last_change ? new Date(stats.last_change.changed_at).toLocaleString() : 'Jamais'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div 
                        className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
                            hoveredCard === 'filters' ? 'ring-2 ring-cyan-500/50' : ''
                        }`}
                        onMouseEnter={() => setHoveredCard('filters')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                                    <FunnelIcon className="h-5 w-5 text-white" />
                                </div>
                                Filtres
                            </h3>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                            >
                                Effacer Tout
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Statut
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                >
                                    <option value="">Tous les Statuts</option>
                                    <option value="online">En Ligne</option>
                                    <option value="offline">Hors Ligne</option>
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Date Début
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Date Fin
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                            </div>

                            {/* Apply Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={applyFilters}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                >
                                    <FunnelIcon className="h-4 w-4" />
                                    Appliquer Filtres
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* History Table */}
                    <div 
                        className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
                            hoveredCard === 'historyTable' ? 'ring-2 ring-cyan-500/50' : ''
                        }`}
                        onMouseEnter={() => setHoveredCard('historyTable')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="p-6">
                            {!history || !historyData ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">Chargement des données d'historique...</p>
                                </div>
                            ) : (
                                <>
                                <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-black/20">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSort('status')}
                                                    className="flex items-center space-x-1 hover:text-cyan-400 transition-colors duration-200"
                                                >
                                                    <span>Statut</span>
                                                    {sortField === 'status' && (
                                                        sortDirection === 'asc' ? 
                                                        <ArrowUpIcon className="h-4 w-4" /> : 
                                                        <ArrowDownIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSort('changed_at')}
                                                    className="flex items-center space-x-1 hover:text-cyan-400 transition-colors duration-200"
                                                >
                                                    <span>Modifié le</span>
                                                    {sortField === 'changed_at' && (
                                                        sortDirection === 'asc' ? 
                                                        <ArrowUpIcon className="h-4 w-4" /> : 
                                                        <ArrowDownIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Il y a
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-white/10">
                                        {historyData.length > 0 ? (
                                            historyData.map((entry) => (
                                                <tr 
                                                    key={entry.id} 
                                                    className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {getStatusIcon(entry.status)}
                                                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                                                                {entry.status === 'online' ? 'en ligne' : 'hors ligne'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                    {entry.changed_at ? new Date(entry.changed_at).toLocaleString() : 'Inconnu'}
                                                </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {entry.time_ago}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-4 text-center text-gray-400">
                                                    Aucun enregistrement d'historique trouvé
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {historyLinks && historyLinks.length > 0 && (
                                <div className="mt-6">
                                    <nav className="flex items-center justify-between">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            {historyPrevPageUrl && isValidUrl(historyPrevPageUrl) && (
                                                <Link
                                                    href={historyPrevPageUrl}
                                                    className="relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-400 bg-black/40 hover:bg-black/60 transition-all duration-300"
                                                >
                                                    Précédent
                                                </Link>
                                            )}
                                            {historyNextPageUrl && isValidUrl(historyNextPageUrl) && (
                                                <Link
                                                    href={historyNextPageUrl}
                                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-400 bg-black/40 hover:bg-black/60 transition-all duration-300"
                                                >
                                                    Suivant
                                                </Link>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-400">
                                                    Affichage{' '}
                                                    <span className="font-medium text-white">{historyFrom}</span>
                                                    {' '}à{' '}
                                                    <span className="font-medium text-white">{historyTo}</span>
                                                    {' '}de{' '}
                                                    <span className="font-medium text-white">{historyTotal}</span>
                                                    {' '}résultats
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    {historyLinks.map((link, index) => {
                                                        // Skip links with null or undefined URLs
                                                        if (!link.url || !isValidUrl(link.url)) {
                                                            return (
                                                                <span
                                                                    key={index}
                                                                    className="relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium text-gray-500 bg-black/20 cursor-not-allowed"
                                                                >
                                                                    {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                                                </span>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <Link
                                                                key={index}
                                                                href={link.url}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-300 ${
                                                                    link.active
                                                                        ? 'z-10 bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                                                        : 'bg-black/40 border-white/10 text-gray-400 hover:bg-black/60 hover:text-white'
                                                                }`}
                                                            >
                                                                {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                                            </Link>
                                                        );
                                                    })}
                                                </nav>
                                            </div>
                                        </div>
                                    </nav>
                                </div>
                            )}
                            </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default function DeviceHistoryShow({ auth, device, history = {}, filters = {}, stats = {} }) {
    return (
        <ErrorBoundary auth={auth} device={device} history={history} filters={filters} stats={stats}>
            <DeviceHistoryShowComponent auth={auth} device={device} history={history} filters={filters} stats={stats} />
        </ErrorBoundary>
    );
}
