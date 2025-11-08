import React, { useState } from 'react';
import { router, Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ExclamationTriangleIcon,
    ComputerDesktopIcon,
    TagIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowLeftIcon,
    ArrowTrendingUpIcon,
    SignalIcon,
    ArrowTrendingDownIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

export default function Unknown({ auth, devices, departments, uniteMateriels }) {
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [showClassifyModal, setShowClassifyModal] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        device_ids: [],
        unite_materiel_id: '',
    });

    const deviceList = devices?.data || [];

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

    const handleQuickClassify = (device, uniteMatérielId) => {
        router.post(route('devices.quick-classify', device.id), {
            unite_materiel_id: uniteMatérielId
        });
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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg shadow-lg">
                            <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Classification des Équipements</p>
                            <h2 className="text-2xl font-bold text-white">Équipements Inconnus</h2>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link 
                            href={route('devices.index')}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                            Retour à Tous les Équipements
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Équipements Inconnus - Classification Requise" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="space-y-6">
                        
                        {/* Warning Banner */}
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl">
                                    <ExclamationTriangleIcon className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-yellow-400">Classification Requise</h3>
                                    <p className="text-yellow-400/70 mt-1">
                                        {deviceList.length} équipement(s) doivent être classifiés et affectés à des départements et unités matérielles.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div 
                                className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-yellow-500/20 cursor-pointer ${
                                    hoveredCard === 'total' ? 'ring-2 ring-yellow-500/50' : ''
                                }`}
                                onMouseEnter={() => setHoveredCard('total')}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className="flex items-center">
                                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white transition-all duration-300">
                                            {deviceList.length}
                                        </div>
                                        <div className="text-gray-400">Total Inconnus</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center text-sm text-yellow-400">
                                    <BoltIcon className="h-4 w-4 mr-1" />
                                    <span>Action Requise</span>
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
                                            {deviceList.filter(d => d.icmp_status === 'online').length}
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
                                            {deviceList.filter(d => d.icmp_status === 'offline').length}
                                        </div>
                                        <div className="text-gray-400">Hors Ligne</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center text-sm text-red-400">
                                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                    <span>Attention Requise</span>
                                </div>
                            </div>
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
                                            Classifier Sélectionnés
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Unknown Devices Table */}
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
                                                Statut
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Actions Rapides
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
                                                className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
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
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {getDeviceStatusIcon(device.icmp_status)}
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeviceStatusColor(device.icmp_status)}`}>
                                                            {device.icmp_status === 'online' ? 'en ligne' : device.icmp_status === 'offline' ? 'hors ligne' : device.icmp_status || 'inconnu'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-2">
                                                        {departments?.slice(0, 3).map(dept => (
                                                            <button
                                                                key={dept.id}
                                                                onClick={() => handleQuickClassify(device, dept.id)}
                                                                className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/30 transition-all duration-200"
                                                            >
                                                                {dept.name}
                                                            </button>
                                                        ))}
                                                        {departments?.length > 3 && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedDevice(device);
                                                                    setShowClassifyModal(true);
                                                                }}
                                                                className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-all duration-200"
                                                            >
                                                                Plus...
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <Link 
                                                            href={route('devices.show', device.id)} 
                                                            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                                            title="Voir Détails"
                                                        >
                                                            <ComputerDesktopIcon className="h-5 w-5" />
                                                        </Link>
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedDevice(device);
                                                                setShowClassifyModal(true);
                                                            }}
                                                            className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                                                            title="Classifier"
                                                        >
                                                            <TagIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                                    <div className="flex flex-col items-center">
                                                        <CheckCircleIcon className="h-12 w-12 text-green-400 mb-4" />
                                                        <p>Aucun équipement inconnu trouvé !</p>
                                                        <p className="text-xs mt-1">Tous les équipements ont été correctement classifiés.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Classification Modal */}
            {showClassifyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-black/80 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full">
                        <h3 className="text-lg font-medium text-white mb-4">
                            Classifier {selectedDevice ? 'l\'Équipement' : selectedDevices.length + ' Équipement(s)'}
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
                                        setSelectedDevice(null);
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
                                    {processing ? 'Classification...' : 'Classifier Équipement(s)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
