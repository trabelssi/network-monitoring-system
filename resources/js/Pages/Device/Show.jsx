import React from 'react';
import { usePage, Link, Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    EyeIcon, 
    PencilSquareIcon, 
    ArrowLeftIcon,
    ComputerDesktopIcon,
    CheckCircleIcon,
    XCircleIcon,
    WifiIcon,
    LinkIcon,
    ClockIcon,
    MinusCircleIcon,
    ArrowTrendingUpIcon,
    SignalIcon,
    ArrowTrendingDownIcon,
    BoltIcon,
    ExclamationTriangleIcon,
    ClockIcon as HistoryIcon,
    SignalIcon as PingIcon
} from '@heroicons/react/24/outline';

export default function Show({ auth, device, flash }) {
    const [checkingStatus, setCheckingStatus] = React.useState(false);
    const [statusMessage, setStatusMessage] = React.useState(flash?.success || flash?.error || null);
    const [statusType, setStatusType] = React.useState(flash?.success ? 'success' : flash?.error ? 'error' : null);

    // Clear flash messages after component mounts
    React.useEffect(() => {
        if (flash?.success || flash?.error) {
            // Clear the message after 5 seconds
            const timer = setTimeout(() => {
                setStatusMessage(null);
                setStatusType(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

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
                return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
            case 'offline':
                return <XCircleIcon className="h-5 w-5 text-red-400" />;
            default:
                return <ClockIcon className="h-5 w-5 text-yellow-400" />;
        }
    };

    const { post, processing } = useForm();

    const getStatusBadge = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'online':
                return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30"><CheckCircleIcon className="h-4 w-4 mr-1" /> En Ligne</span>;
            case 'offline':
                return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30"><XCircleIcon className="h-4 w-4 mr-1" /> Hors Ligne</span>;
            default:
                return <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><MinusCircleIcon className="h-4 w-4 mr-1" /> Inconnu</span>;
        }
    };

    const checkDeviceStatus = async () => {
        setCheckingStatus(true);
        try {
            const response = await axios.post(route('devices.ping', device.id));
            if (response.data.success) {
                setStatusMessage('Statut de l\'équipement mis à jour avec succès');
                setStatusType('success');
                // Refresh the page to show updated status
                window.location.reload();
            }
        } catch (error) {
            setStatusMessage('Échec de la vérification du statut de l\'équipement');
            setStatusType('error');
        } finally {
            setCheckingStatus(false);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <EyeIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Détails de l'Équipement</p>
                            <h2 className="text-2xl font-bold text-white">Informations de l'Équipement</h2>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            href={route('device.history.show', device.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
                        >
                            <HistoryIcon className="w-5 h-5" />
                            <span>Historique</span>
                        </Link>
                        <button
                            onClick={checkDeviceStatus}
                            disabled={checkingStatus}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50"
                        >
                            <PingIcon className="w-5 h-5" />
                            <span>{checkingStatus ? 'Ping en cours...' : 'Ping'}</span>
                        </button>
                        <Link 
                            href={route('devices.edit', device.id)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                            <span>Modifier</span>
                        </Link>
                        <Link 
                            href={route('devices.index')}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span>Retour à la Liste</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Équipement: ${device.hostname}`} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        
                        {/* Status Message */}
                        {statusMessage && (
                            <div className={`p-4 rounded-lg border ${
                                statusType === 'success' 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                                {statusMessage}
                            </div>
                        )}

                        {/* Device Overview */}
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                                        <ComputerDesktopIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{device.hostname}</h3>
                                        <p className="text-gray-400">{device.ip_address}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(device.is_alive ? 'online' : 'offline')}
                                </div>
                            </div>

                            {/* Device Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                                            <CheckCircleIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Statut</p>
                                            <p className="text-lg font-semibold text-white capitalize">{device.icmp_status === 'online' ? 'En Ligne' : device.icmp_status === 'offline' ? 'Hors Ligne' : device.icmp_status || 'Inconnu'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center text-sm text-green-400">
                                        <SignalIcon className="h-4 w-4 mr-1" />
                                        <span>Santé du Réseau</span>
                                    </div>
                                </div>

                                <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-2 rounded-lg">
                                            <LinkIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Affectation</p>
                                            <p className="text-lg font-semibold text-white">{device.auto_assigned ? 'Automatique' : 'Manuelle'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center text-sm text-indigo-400">
                                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                        <span>Configuration</span>
                                    </div>
                                </div>

                                <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg">
                                            <ComputerDesktopIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400">Type</p>
                                            <p className="text-lg font-semibold text-white">Équipement Réseau</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center text-sm text-purple-400">
                                        <BoltIcon className="h-4 w-4 mr-1" />
                                        <span>Actif</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Device Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ComputerDesktopIcon className="h-5 w-5 text-cyan-400" />
                                    Informations de Base
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Nom d'Hôte</label>
                                        <p className="text-white font-medium">{device.hostname}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Adresse IP</label>
                                        <p className="text-white font-medium">{device.ip_address || 'Non renseigné'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Numéro d'Inventaire</label>
                                        <p className="text-white font-medium">{device.asset_number || 'Non renseigné'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Contact Système</label>
                                        <p className="text-white font-medium">{device.sys_contact || 'Non renseigné'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Statut</label>
                                        <p className={`font-medium ${device.is_alive ? 'text-green-400' : 'text-red-400'}`}>
                                            {device.is_alive ? 'En ligne' : 'Hors ligne'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* System Information */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <WifiIcon className="h-5 w-5 text-cyan-400" />
                                    Informations Système
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Description Système</label>
                                        <p className="text-white font-medium">{device.sys_descr || 'Non renseigné'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Localisation Système</label>
                                        <p className="text-white font-medium">{device.sys_location || 'Non renseigné'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Communauté SNMP</label>
                                        <p className="text-white font-medium">{device.snmp_community || 'Par défaut'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">OID SNMP</label>
                                        <p className="text-white font-medium">{device.snmp_oid || 'Par défaut'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Créé le</label>
                                        <p className="text-white font-medium">{new Date(device.created_at).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Department and Equipment Unit */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Department Information */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ComputerDesktopIcon className="h-5 w-5 text-indigo-400" />
                                    Département
                                </h4>
                                {device.department && device.department.name !== 'Unknown Department' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Nom du Département</label>
                                            <p className="text-white font-medium">{device.department.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">ID Département</label>
                                            <p className="text-white font-medium">#{device.department.id}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                                            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                                            <p className="text-yellow-400 font-medium">Département Inconnu</p>
                                            <p className="text-yellow-400/70 text-sm">Cet équipement doit être classifié</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Equipment Unit Information */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ComputerDesktopIcon className="h-5 w-5 text-teal-400" />
                                    Unité Matériel
                                </h4>
                                {device.unite_materiel && device.unite_materiel.name !== 'Unknown Unité Matériel' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Nom de l'Unité</label>
                                            <p className="text-white font-medium">{device.unite_materiel.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">ID Unité</label>
                                            <p className="text-white font-medium">#{device.unite_materiel.id}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Département</label>
                                            <p className="text-white font-medium">
                                                {device.department?.name === 'Unknown Department' 
                                                    ? 'Département Inconnu' 
                                                    : device.department?.name || 'Inconnu'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                                            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                                            <p className="text-yellow-400 font-medium">Unité Matériel Inconnue</p>
                                            <p className="text-yellow-400/70 text-sm">Cet équipement doit être classifié</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {device.description && (
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4">Description</h4>
                                <p className="text-gray-300 leading-relaxed">{device.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 