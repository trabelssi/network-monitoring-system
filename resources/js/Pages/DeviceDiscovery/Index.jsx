import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    MagnifyingGlassIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    TrashIcon,
    EyeIcon,
    ArrowPathIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

export default function DeviceDiscoveryIndex({ auth, stats, recentDiscoveries }) {
    const [discoveryInput, setDiscoveryInput] = useState('');
    const [discoveryType, setDiscoveryType] = useState('single'); // 'single' or 'subnet'
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanResults, setScanResults] = useState(null);
    const [queueResults, setQueueResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isAutoAssigning, setIsAutoAssigning] = useState(false);
    const [pendingStats, setPendingStats] = useState({
        total_pending: 0,
        alive_devices: 0,
        with_snmp: 0,
        can_process: false
    });

    // Load initial queue results and pending stats
    useEffect(() => {
        loadQueueResults();
        loadPendingStats();
    }, []);

    const loadQueueResults = async (page = 1, status = '') => {
        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
                ...(status && { status })
            });

            const response = await axios.get(`/discovery/queue?${params}`);
            if (response.data.success) {
                setQueueResults(response.data.data);
                setCurrentPage(response.data.pagination.current_page);
                setTotalPages(response.data.pagination.last_page);
                
                // Also refresh pending stats
                await loadPendingStats();
            }
        } catch (error) {
            console.error('Failed to load queue results:', error);
            setError("Échec du chargement des résultats de la file d'attente de découverte");
        }
    };

    const loadPendingStats = async () => {
        try {
            const response = await axios.get('/discovery/auto-assignment/stats');
            if (response.data.success) {
                setPendingStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load pending stats:', error);
        }
    };

    const handleAutoAssignment = async () => {
        setIsAutoAssigning(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post('/discovery/auto-assignment');
            
            if (response.data.success) {
                setSuccess(response.data.message);
                
                // Reload both queue results and pending stats
                await Promise.all([
                    loadQueueResults(),
                    loadPendingStats()
                ]);
                
                // Show detailed results
                if (response.data.stats) {
                    const stats = response.data.stats;
                    setSuccess(`Auto-assignment completed! Processed: ${stats.processed}, Created: ${stats.created}, Updated: ${stats.updated}, Failed: ${stats.failed}`);
                }
            } else {
                setError(response.data.message || "L'auto-assignation a échoué");
            }
        } catch (error) {
            console.error('Auto-assignment failed:', error);
            setError(error.response?.data?.message || "L'auto-assignation a échoué");
        } finally {
            setIsAutoAssigning(false);
        }
    };

    const handleDiscovery = async () => {
        if (!discoveryInput.trim()) {
            setError('Veuillez entrer une adresse IP ou un sous-réseau');
            return;
        }

        setIsScanning(true);
        setScanProgress(0);
        setError(null);
        setSuccess(null);
        setScanResults(null);

        try {
            const endpoint = discoveryType === 'single' ? '/discovery/single-ip' : '/discovery/subnet';
            const data = discoveryType === 'single' 
                ? { ip_address: discoveryInput }
                : { subnet: discoveryInput };

            // Simulate progress for subnet scans
            if (discoveryType === 'subnet') {
                const progressInterval = setInterval(() => {
                    setScanProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);
            }

            const response = await axios.post(endpoint, data);
            
            if (response.data.success) {
                setScanResults(response.data);
                setSuccess(response.data.message);
                
                // Reload queue results to show new discoveries
                await loadQueueResults();
                
                if (discoveryType === 'single') {
                    setScanProgress(100);
                }
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            console.error('Discovery failed:', error);
            setError(error.response?.data?.message || 'La découverte a échoué');
        } finally {
            setIsScanning(false);
            if (discoveryType === 'single') {
                setScanProgress(100);
            }
        }
    };

    const clearOldRecords = async () => {
        try {
            const response = await axios.post('/discovery/clear-old', { days: 7 });
            if (response.data.success) {
                setSuccess(response.data.message);
                await loadQueueResults();
            }
        } catch (error) {
            setError('Échec de la suppression des anciens enregistrements');
        }
    };

    const deleteDiscovery = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de découverte ?')) return;
        
        try {
            await axios.delete(`/discovery/${id}`);
            setSuccess('Enregistrement de découverte supprimé avec succès');
            await loadQueueResults();
        } catch (error) {
            setError("Échec de la suppression de l'enregistrement de découverte");
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: ClockIcon, text: 'En Attente' },
            processed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircleIcon, text: 'Traité' },
            failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircleIcon, text: 'Échoué' }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-300 ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
            </span>
        );
    };

    const getAliveBadge = (isAlive) => {
        return isAlive ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 transition-all duration-300">
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Actif
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 transition-all duration-300">
                <XCircleIcon className="w-3 h-3 mr-1" />
                Hors Ligne
            </span>
        );
    };

    return (
        <AuthenticatedLayout 
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <GlobeAltIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Découverte Réseau</p>
                            <h2 className="text-2xl font-bold text-white">Tableau de Bord Découverte d'Appareils</h2>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleAutoAssignment}
                            disabled={isAutoAssigning || !pendingStats.can_process}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChartBarIcon className="w-5 h-5" />
                            <span>{isAutoAssigning ? 'Traitement...' : 'Auto-Assignation'}</span>
                        </button>
                        <button
                            onClick={() => loadQueueResults()}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                            <span>Actualiser File d'Attente</span>
                        </button>
                        <button
                            onClick={clearOldRecords}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                        >
                            <TrashIcon className="w-5 h-5" />
                            <span>Nettoyer Anciennes</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Découverte d'Appareils" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Discovery Input */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-lg font-medium text-white mb-4 flex items-center">
                                <GlobeAltIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                Démarrer Scan de Découverte
                            </h2>
                            
                            <div className="flex flex-col space-y-4">
                                {/* Discovery Type Selection */}
                                <div className="flex space-x-4">
                                    <label className="flex items-center text-white">
                                        <input
                                            type="radio"
                                            value="single"
                                            checked={discoveryType === 'single'}
                                            onChange={(e) => setDiscoveryType(e.target.value)}
                                            className="mr-2 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        Adresse IP Unique
                                    </label>
                                    <label className="flex items-center text-white">
                                        <input
                                            type="radio"
                                            value="subnet"
                                            checked={discoveryType === 'subnet'}
                                            onChange={(e) => setDiscoveryType(e.target.value)}
                                            className="mr-2 text-cyan-500 focus:ring-cyan-500"
                                        />
                                        Plage de Sous-Réseau
                                    </label>
                                </div>

                                {/* Input Field */}
                                <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={discoveryInput}
                                            onChange={(e) => setDiscoveryInput(e.target.value)}
                                            placeholder={discoveryType === 'single' ? '192.168.1.10' : '192.168.1.0/24'}
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        onClick={handleDiscovery}
                                        disabled={isScanning || !discoveryInput.trim()}
                                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                    >
                                        {isScanning ? (
                                            <>
                                                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                                                Scan en cours...
                                            </>
                                        ) : (
                                            <>
                                                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                                                Découvrir
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                {isScanning && (
                                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${scanProgress}%` }}
                                        ></div>
                                    </div>
                                )}

                                {/* Help Text */}
                                <div className="text-sm text-gray-400">
                                    {discoveryType === 'single' ? (
                                        <p>Entrez une adresse IP unique pour découvrir un appareil spécifique</p>
                                    ) : (
                                        <p>Entrez un sous-réseau en notation CIDR (ex: 192.168.1.0/24) pour scanner une plage entière</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scan Results */}
                    {scanResults && (
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-lg font-medium text-white mb-4 flex items-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                    Résultats du Scan
                                </h2>
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <CheckCircleIcon className="w-5 h-5 text-cyan-400 mr-2" />
                                        <span className="text-cyan-300 font-medium">{scanResults.message}</span>
                                    </div>
                                    {scanResults.total_scanned && (
                                        <div className="mt-2 text-sm text-cyan-400">
                                            Scanné {scanResults.total_scanned} IPs, trouvé {scanResults.alive_devices} appareils actifs
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Discovery Queue */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-medium text-white flex items-center">
                                    <ChartBarIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                    File d'Attente de Découverte
                                </h2>
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => {
                                            setSelectedStatus(e.target.value);
                                            loadQueueResults(1, e.target.value);
                                        }}
                                        className="px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <option value="">Tous les Statuts</option>
                                        <option value="pending">En Attente</option>
                                        <option value="processed">Traité</option>
                                        <option value="failed">Échoué</option>
                                    </select>
                                </div>
                            </div>

            {/* Auto-Assignment Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                            <ChartBarIcon className="w-5 h-5 mr-2 text-purple-400" />
                            Statut Auto-Assignation
                        </h3>
                        <p className="text-sm text-gray-400">
                            Classifiez automatiquement les appareils en attente basé sur les données SNMP et les déplacer vers la table principale des appareils
                        </p>
                    </div>
                </div>
                
                {/* Auto-Assignment Stats */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                        <div className="text-2xl font-bold text-purple-400">{pendingStats.total_pending}</div>
                        <div className="text-sm text-gray-400">Appareils en Attente</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                        <div className="text-2xl font-bold text-green-400">{pendingStats.alive_devices}</div>
                        <div className="text-sm text-gray-400">Appareils Actifs</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                        <div className="text-2xl font-bold text-blue-400">{pendingStats.with_snmp}</div>
                        <div className="text-sm text-gray-400">Avec SNMP</div>
                    </div>
                </div>
            </div>                            {/* Queue Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-black/20">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Adresse IP</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actif</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">SNMP</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Découvert</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-white/10">
                                        {queueResults.map((discovery) => (
                                            <tr key={discovery.id} className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                    {discovery.ip_address}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(discovery.discovery_status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getAliveBadge(discovery.is_alive)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {discovery.snmp_available ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                            Disponible
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                                            <XCircleIcon className="w-3 h-3 mr-1" />
                                                            Indisponible
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
                                                    {discovery.sys_descr || 'Aucune description'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                    {new Date(discovery.discovered_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={`/discovery/${discovery.id}`}
                                                            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                                            title="Voir Détails"
                                                        >
                                                            <EyeIcon className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => deleteDiscovery(discovery.id)}
                                                            className="text-red-400 hover:text-red-300 transition-colors duration-200"
                                                            title="Supprimer"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-400">
                                        Page {currentPage} de {totalPages}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => loadQueueResults(currentPage - 1, selectedStatus)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-50 text-white bg-black/20 hover:bg-black/40 transition-all duration-300"
                                        >
                                            Précédent
                                        </button>
                                        <button
                                            onClick={() => loadQueueResults(currentPage + 1, selectedStatus)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-50 text-white bg-black/20 hover:bg-black/40 transition-all duration-300"
                                        >
                                            Suivant
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg backdrop-blur-lg">
                    <div className="flex items-center">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="absolute top-0 right-0 p-1 text-red-300 hover:text-red-100 transition-colors duration-200"
                    >
                        <XCircleIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="fixed bottom-4 right-4 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg backdrop-blur-lg">
                    <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        {success}
                    </div>
                    <button
                        onClick={() => setSuccess(null)}
                        className="absolute top-0 right-0 p-1 text-green-300 hover:text-green-100 transition-colors duration-200"
                    >
                        <XCircleIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
