import React, { useState } from 'react';
import { router, usePage, Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    PlusIcon, 
    EyeIcon, 
    PencilSquareIcon, 
    TrashIcon,
    ComputerDesktopIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    TagIcon,
    Squares2X2Icon,
    ArrowTrendingUpIcon,
    SignalIcon,
    ArrowTrendingDownIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

export default function Index({ auth, devices, filters = {}, departments, uniteMateriels, stats = {} }) {
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [showClassifyModal, setShowClassifyModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        device_ids: [],
        unite_materiel_id: '',
    });

    const { data: searchData, setData: setSearchData, get } = useForm({
        search: filters.search || '',
        status: filters.status || '',
        department: filters.department || '',
        unknown: filters.unknown || false,
    });

    const deviceList = devices?.data || [];

    const handleSearch = (e) => {
        e.preventDefault();
        get(route('devices.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSelectDevice = (deviceId) => {
        setSelectedDevices(prev => 
            prev.includes(deviceId) 
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleSelectAll = () => {
        if (selectedDevices.length === deviceList.length) {
            setSelectedDevices([]);
        } else {
            setSelectedDevices(deviceList.map(device => device.id));
        }
    };

    const handleBulkClassify = (e) => {
        e.preventDefault();
        data.device_ids = selectedDevices;
        post(route('devices.bulk-classify'), {
            onSuccess: () => {
                setShowClassifyModal(false);
                setSelectedDevices([]);
                reset();
            }
        });
    };

    const handleBulkDelete = () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedDevices.length} équipements ?`)) {
            router.post(route('devices.bulk-delete'), {
                device_ids: selectedDevices
            }, {
                onSuccess: () => setSelectedDevices([])
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
            router.delete(route('devices.destroy', id));
        }
    };

    const getDeviceStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'online':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'offline':
                return 'bg-red-500/20 text-red-400 border border-red-500/30';
            default:
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
        }
    };

    const getDeviceStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'online':
                return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
            case 'offline':
                return <XCircleIcon className="h-4 w-4 text-red-400" />;
            default:
                return <ClockIcon className="h-4 w-4 text-yellow-400" />;
        }
    };

    const isUnknownDevice = (device) => {
        return device.unite_materiel?.name === 'Unknown Unité Matériel' ||
               device.department?.name === 'Unknown Department';
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <ComputerDesktopIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Gestion des Équipements</p>
                            <h2 className="text-2xl font-bold text-white">Réseau Sancella</h2>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <Link 
                            href={route('devices.unknown')}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <ExclamationTriangleIcon className="h-5 w-5" />
                            Équipements Inconnus ({stats.unknown})
                        </Link>
                        <Link 
                            href={route('devices.create')}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Ajouter Équipement
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Équipements - Sancella" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div 
                                className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
                                    hoveredCard === 'total' ? 'ring-2 ring-cyan-500/50' : ''
                                }`}
                                onMouseEnter={() => setHoveredCard('total')}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                        <ComputerDesktopIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white transition-all duration-300">
                                            {stats.total}
                                        </div>
                                        <div className="text-gray-400">Total Équipements</div>
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
                            >
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                        <CheckCircleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white transition-all duration-300">
                                            {stats.online}
                                        </div>
                                        <div className="text-gray-400">En Ligne</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center text-sm text-green-400">
                                    <SignalIcon className="h-4 w-4 mr-1" />
                                    <span>En Bonne Santé</span>
                                </div>
                            </div>
                            
                            <div 
                                className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-yellow-500/20 cursor-pointer ${
                                    hoveredCard === 'unknown' ? 'ring-2 ring-yellow-500/50' : ''
                                }`}
                                onMouseEnter={() => setHoveredCard('unknown')}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white transition-all duration-300">
                                            {stats.unknown}
                                        </div>
                                        <div className="text-gray-400">Nécessite Classification</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center text-sm text-yellow-400">
                                    <BoltIcon className="h-4 w-4 mr-1" />
                                    <span>Action Requise</span>
                                </div>
                            </div>
                            
                            <div 
                                className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer ${
                                    hoveredCard === 'availability' ? 'ring-2 ring-purple-500/50' : ''
                                }`}
                                onMouseEnter={() => setHoveredCard('availability')}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                        <Squares2X2Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white transition-all duration-300">
                                            {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%
                                        </div>
                                        <div className="text-gray-400">Disponibilité</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center text-sm text-purple-400">
                                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                    <span>Santé du Réseau</span>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <form onSubmit={handleSearch} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Rechercher</label>
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchData.search}
                                            onChange={e => setSearchData('search', e.target.value)}
                                            placeholder="Rechercher par nom d'hôte, IP, ou numéro d'inventaire..."
                                            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="w-48">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Statut</label>
                                    <select
                                        value={searchData.status}
                                        onChange={e => setSearchData('status', e.target.value)}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    >
                                        <option value="">Tous les Statuts</option>
                                        <option value="online">En Ligne</option>
                                        <option value="offline">Hors Ligne</option>
                                        <option value="unknown">Inconnu</option>
                                    </select>
                                </div>

                                <div className="w-48">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Département</label>
                                    <select
                                        value={searchData.department}
                                        onChange={e => setSearchData('department', e.target.value)}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    >
                                        <option value="">Tous les Départements</option>
                                        {departments?.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={searchData.unknown}
                                            onChange={e => setSearchData('unknown', e.target.checked)}
                                            className="rounded border-white/10 text-cyan-500 focus:ring-cyan-500 bg-black/40"
                                        />
                                        <span className="ml-2 text-sm text-gray-400">Inconnus uniquement</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                >
                                    <FunnelIcon className="h-5 h-5" />
                                    Filtrer
                                </button>
                            </form>
                        </div>

                        {/* Bulk Actions */}
                        {selectedDevices.length > 0 && (
                            <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-cyan-400 font-medium">
                                        {selectedDevices.length} équipement(s) sélectionné(s)
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowClassifyModal(true)}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                        >
                                            <TagIcon className="h-4 w-4" />
                                            Classifier
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Device Table */}
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-black/20">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDevices.length === deviceList.length && deviceList.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="rounded border-white/10 text-cyan-500 focus:ring-cyan-500 bg-black/40"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Équipement
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Adresse IP
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Département
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Unité Matériel
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Statut
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Affectation
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-white/10">
                                        {deviceList && deviceList.length > 0 ? deviceList.map(device => (
                                            <tr 
                                                key={device.id} 
                                                className={`hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${isUnknownDevice(device) ? 'bg-yellow-500/10' : ''}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDevices.includes(device.id)}
                                                        onChange={() => handleSelectDevice(device.id)}
                                                        className="rounded border-white/10 text-cyan-500 focus:ring-cyan-500 bg-black/40"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <ComputerDesktopIcon className="h-6 w-6 text-gray-400 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-white">
                                                                {device.hostname}
                                                            </div>
                                                            {device.asset_number && (
                                                                <div className="text-sm text-gray-500">
                                                                    #{device.asset_number}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                    {device.ip_address || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        device.department?.name === 'Unknown Department' 
                                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                                    }`}>
                                                        {device.department?.name === 'Unknown Department' ? 'Département Inconnu' : device.department?.name || 'Inconnu'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        device.unite_materiel?.name === 'Unknown Unité Matériel' 
                                                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                                            : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                                    }`}>
                                                        {device.unite_materiel?.name === 'Unknown Unité Matériel' ? 'Unité Matériel Inconnue' : device.unite_materiel?.name || 'Inconnu'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {getDeviceStatusIcon(device.is_alive ? 'online' : 'offline')}
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeviceStatusColor(device.is_alive ? 'online' : 'offline')}`}>
                                                            {device.is_alive ? 'En ligne' : 'Hors ligne'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        device.auto_assigned ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                    }`}>
                                                        {device.auto_assigned ? 'Automatique' : 'Manuelle'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <Link 
                                                            href={route('devices.show', device.id)} 
                                                            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                                            title="Voir Détails"
                                                        >
                                                            <EyeIcon className="h-5 w-5" />
                                                        </Link>
                                                        <Link 
                                                            href={route('devices.edit', device.id)} 
                                                            className="text-green-400 hover:text-green-300 transition-colors duration-200"
                                                            title="Modifier"
                                                        >
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </Link>
                                                        {isUnknownDevice(device) && (
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedDevices([device.id]);
                                                                    setShowClassifyModal(true);
                                                                }}
                                                                className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                                                                title="Classifier"
                                                            >
                                                                <TagIcon className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDelete(device.id)} 
                                                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <ComputerDesktopIcon className="h-12 w-12 text-gray-400 mb-4" />
                                                        <p>Aucun équipement trouvé.</p>
                                                        <p className="text-xs mt-1">Commencez par ajouter votre premier équipement ou lancez la découverte réseau.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Pagination */}
                        {devices?.links && (
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Affichage de {devices.from || 0} à {devices.to || 0} sur {devices.total || 0} résultats
                                </div>
                                <div className="flex gap-2">
                                    {(devices.links || []).map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                                                link.active
                                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                                    : link.url
                                                    ? 'bg-black/20 text-gray-400 hover:bg-black/40 hover:text-white border border-white/10'
                                                    : 'bg-black/10 text-gray-600 cursor-not-allowed border border-white/5'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Classification Modal */}
            {showClassifyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-black/80 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full">
                        <h3 className="text-lg font-medium text-white mb-4">
                            Classifier {selectedDevices.length} Équipement(s)
                        </h3>
                        
                        <form onSubmit={handleBulkClassify}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Unité Matériel
                                </label>
                                <select
                                    value={data.unite_materiel_id}
                                    onChange={e => setData('unite_materiel_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Sélectionner une Unité Matériel</option>
                                    {uniteMateriels?.filter(unit => unit.name !== 'Unknown Unité Matériel').map(unit => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.department?.name} - {unit.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.unite_materiel_id && (
                                    <p className="mt-1 text-sm text-red-400">{errors.unite_materiel_id}</p>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowClassifyModal(false);
                                        setSelectedDevices([]);
                                        reset();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 bg-black/40 border border-white/10 rounded-lg hover:bg-black/60 hover:text-white transition-all duration-300"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                                >
                                    {processing ? 'Classification...' : 'Classifier les Équipements'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}