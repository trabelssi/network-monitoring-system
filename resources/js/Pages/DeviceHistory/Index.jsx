import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ClockIcon,
    ComputerDesktopIcon,
    BuildingOfficeIcon,
    SignalIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
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
        console.error('DeviceHistoryIndex Error:', error, errorInfo);
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
                                    <p className="text-gray-400 mb-4">Il y a eu une erreur lors du chargement de l'historique des appareils.</p>
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

function DeviceHistoryIndexComponent({ auth, history, filters, departments, uniteMateriels, stats }) {
    // Ensure filters is an object, not an array
    const safeFilters = Array.isArray(filters) ? {} : (filters || {});

    const [searchTerm, setSearchTerm] = useState(safeFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(safeFilters.status || '');
    const [selectedDepartment, setSelectedDepartment] = useState(safeFilters.department || '');
    const [selectedUnit, setSelectedUnit] = useState(safeFilters.unit || '');
    const [dateFrom, setDateFrom] = useState(safeFilters.date_from || '');
    const [dateTo, setDateTo] = useState(safeFilters.date_to || '');
    const [sortField, setSortField] = useState(safeFilters.sort || 'changed_at');
    const [sortDirection, setSortDirection] = useState(safeFilters.direction || 'desc');
    const [hoveredCard, setHoveredCard] = useState(null);

    // Helper function to validate URLs
    const isValidUrl = (url) => {
        return url && typeof url === 'string' && url.trim() !== '';
    };

    const applyFilters = () => {
        router.get('/device-history', {
            search: searchTerm,
            status: selectedStatus,
            department: selectedDepartment,
            unit: selectedUnit,
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
        setSearchTerm('');
        setSelectedStatus('');
        setSelectedDepartment('');
        setSelectedUnit('');
        setDateFrom('');
        setDateTo('');
        setSortField('changed_at');
        setSortDirection('desc');
        
        router.get('/device-history', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (field) => {
        const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
        
        router.get('/device-history', {
            ...safeFilters,
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
                            <p className="text-sm text-gray-400">Surveillance Réseau</p>
                            <h2 className="text-2xl font-bold text-white">Historique Statut Appareils</h2>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        {typeof route === 'function' && isValidUrl(route('devices.index')) && (
                            <Link
                                href={route('devices.index')}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                            >
                                <ComputerDesktopIcon className="w-5 h-5" />
                                Gérer Appareils
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Historique Statut Appareils" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
                                hoveredCard === 'total' ? 'ring-2 ring-cyan-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('total')}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <ChartBarIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white transition-all duration-300">
                                        {stats.total_entries}
                                    </div>
                                    <div className="text-gray-400">Total Entrées</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-cyan-400">
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                <span>Tout le Temps</span>
                            </div>
                        </div>

                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer ${
                                hoveredCard === 'online' ? 'ring-2 ring-green-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('online')}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <CheckCircleIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white transition-all duration-300">
                                        {stats.online_changes}
                                    </div>
                                    <div className="text-gray-400">Changements En Ligne</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-green-400">
                                <SignalIcon className="h-4 w-4 mr-1" />
                                <span>Sain</span>
                            </div>
                        </div>

                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-red-500/20 cursor-pointer ${
                                hoveredCard === 'offline' ? 'ring-2 ring-red-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('offline')}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <XCircleIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white transition-all duration-300">
                                        {stats.offline_changes}
                                    </div>
                                    <div className="text-gray-400">Changements Hors Ligne</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-red-400">
                                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                <span>Nécessite Attention</span>
                            </div>
                        </div>

                        <div 
                            className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-yellow-500/20 cursor-pointer ${
                                hoveredCard === 'today' ? 'ring-2 ring-yellow-500/50' : ''
                            }`}
                            onMouseEnter={() => setHoveredCard('today')}
                            onMouseLeave={() => setHoveredCard(null)}
                        >
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <ClockIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white transition-all duration-300">
                                        {stats.today_changes}
                                    </div>
                                    <div className="text-gray-400">Changements d'Aujourd'hui</div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-yellow-400">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                <span>Dernières 24h</span>
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
                                Recherche et Filtres
                            </h3>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                            >
                                Effacer Tout
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Search */}
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Rechercher Appareils
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Recherche par nom d'hôte ou IP..."
                                        className="w-full bg-black/40 border border-white/10 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    />
                                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                </div>
                            </div>

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

                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Département
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                >
                                    <option value="">Tous les Départements</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Unit Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Unité
                                </label>
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                >
                                    <option value="">Toutes les Unités</option>
                                    {uniteMateriels.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Apply Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={applyFilters}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                >
                                    <FunnelIcon className="h-4 w-4" />
                                    Appliquer
                                </button>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-black/20">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSort('device_id')}
                                                    className="flex items-center space-x-1 hover:text-cyan-400 transition-colors duration-200"
                                                >
                                                    <span>Appareil</span>
                                                    {sortField === 'device_id' && (
                                                        sortDirection === 'asc' ? 
                                                        <ArrowUpIcon className="h-4 w-4" /> : 
                                                        <ArrowDownIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
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
                                                Département
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Unité
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-white/10">
                                        {history.data && history.data.length > 0 ? (
                                            history.data.map((entry) => (
                                                <tr 
                                                    key={entry.id} 
                                                    className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-1 rounded mr-3">
                                                                <ComputerDesktopIcon className="h-4 w-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-white">
                                                                    {entry.device?.hostname || 'Inconnu'}
                                                                </div>
                                                                <div className="text-sm text-gray-400">
                                                                    {entry.device?.ip_address || 'Pas d\'IP'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
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
                                                        {entry.device?.department?.name || 'Non assigné'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                        {entry.device?.unite_materiel?.name || 'Non assigné'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {entry.device_id && typeof route === 'function' && isValidUrl(route('device.history.show', entry.device_id)) && (
                                                            <Link
                                                                href={route('device.history.show', entry.device_id)}
                                                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-3 py-1 rounded-lg text-xs transition-all duration-300 transform hover:scale-105"
                                                            >
                                                                Voir Historique
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                                                    Aucun enregistrement d'historique trouvé
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {history.links && history.links.length > 0 && (
                                <div className="mt-6">
                                    <nav className="flex items-center justify-between">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            {history.prev_page_url && isValidUrl(history.prev_page_url) && (
                                                <Link
                                                    href={history.prev_page_url}
                                                    className="relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-400 bg-black/40 hover:bg-black/60 transition-all duration-300"
                                                >
                                                    Précédent
                                                </Link>
                                            )}
                                            {history.next_page_url && isValidUrl(history.next_page_url) && (
                                                <Link
                                                    href={history.next_page_url}
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
                                                    <span className="font-medium text-white">{history.from}</span>
                                                    {' '}à{' '}
                                                    <span className="font-medium text-white">{history.to}</span>
                                                    {' '}de{' '}
                                                    <span className="font-medium text-white">{history.total}</span>
                                                    {' '}résultats
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    {history.links.map((link, index) => {
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
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

export default function DeviceHistoryIndex({ auth, history, filters, departments, uniteMateriels, stats }) {
    return (
        <ErrorBoundary auth={auth}>
            <DeviceHistoryIndexComponent
                auth={auth}
                history={history}
                filters={filters}
                departments={departments}
                uniteMateriels={uniteMateriels}
                stats={stats}
            />
        </ErrorBoundary>
    );
}
