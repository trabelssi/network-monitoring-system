import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    MagnifyingGlassIcon,
    GlobeAltIcon,
    ComputerDesktopIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    TrashIcon,
    ArrowPathIcon,
    ArrowLeftIcon,
    MapPinIcon,
    CpuChipIcon,
    CalendarIcon,
    InformationCircleIcon,
    ClipboardIcon,
    BuildingOfficeIcon,
    CubeIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

export default function DeviceDiscoveryShow({ auth, discovery, departments, units }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [userName, setUserName] = useState('');
    const [assetNumber, setAssetNumber] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de découverte ? Cette action ne peut pas être annulée.')) {
            return;
        }

        try {
            setIsDeleting(true);
            await axios.delete(`/discovery/${discovery.id}`);
            // Redirect back to discovery index
            window.location.href = '/discovery';
        } catch (error) {
            console.error('Failed to delete discovery record:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleManualAssignment = async () => {
        if (!selectedDepartment || !selectedUnit) {
            setErrorMessage('Veuillez sélectionner à la fois le département et l\'unité');
            return;
        }

        try {
            setIsAssigning(true);
            setErrorMessage('');
            
            // Create device data from discovery
            const deviceData = {
                hostname: discovery.sys_name || `Unknown-${discovery.ip_address}`,
                ip_address: discovery.ip_address,
                is_alive: discovery.is_alive,
                snmp_available: discovery.snmp_available,
                sys_descr: discovery.sys_descr,
                sys_object_id: discovery.sys_object_id,
                sys_location: discovery.sys_location,
                department_id: selectedDepartment,
                unit_id: selectedUnit,
                user_name: userName || null,
                asset_number: assetNumber || null,
                last_seen: discovery.discovered_at,
            };

            // Create the device
            const response = await axios.post('/device', deviceData);
            
            if (response.status === 201 || response.status === 200) {
                setSuccessMessage('Appareil assigné et créé avec succès !');
                
                // Mark discovery as processed
                await axios.patch(`/discovery/${discovery.id}/mark-processed`);
                
                // Close modal and reset form
                setTimeout(() => {
                    setShowAssignmentModal(false);
                    setSuccessMessage('');
                    setSelectedDepartment('');
                    setSelectedUnit('');
                    setUserName('');
                    setAssetNumber('');
                }, 2000);
            }
        } catch (error) {
            console.error('Manual assignment failed:', error);
            setErrorMessage(error.response?.data?.message || 'Échec de l\'assignation de l\'appareil');
        } finally {
            setIsAssigning(false);
        }
    };

    const openAssignmentModal = () => {
        console.log('Opening modal with data:', { departments, units });
        setShowAssignmentModal(true);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { 
                color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                icon: ClockIcon,
                text: 'En Attente'
            },
            processed: { 
                color: 'bg-green-500/20 text-green-400 border-green-500/30',
                icon: CheckCircleIcon,
                text: 'Traité'
            },
            failed: { 
                color: 'bg-red-500/20 text-red-400 border-red-500/30',
                icon: XCircleIcon,
                text: 'Échoué'
            }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full border transition-all duration-300 ${config.color}`}>
                <Icon className="w-4 h-4 mr-2" />
                {config.text}
            </span>
        );
    };

    const getAliveBadge = (isAlive) => {
        return isAlive ? (
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30 transition-all duration-300">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Actif
            </span>
        ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 transition-all duration-300">
                <XCircleIcon className="w-4 h-4 mr-2" />
                Hors Ligne
            </span>
        );
    };

    const getSnmpBadge = (snmpAvailable) => {
        return snmpAvailable ? (
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all duration-300">
                <CpuChipIcon className="w-4 h-4 mr-2" />
                SNMP Disponible
            </span>
        ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30 transition-all duration-300">
                <XCircleIcon className="w-4 h-4 mr-2" />
                SNMP Indisponible
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
                            <ComputerDesktopIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Détails de Découverte</p>
                            <h2 className="text-2xl font-bold text-white">{discovery.ip_address}</h2>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {(discovery.discovery_status === 'pending' || discovery.discovery_status === 'failed') && (
                            <button
                                onClick={openAssignmentModal}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                            >
                                <BuildingOfficeIcon className="w-5 h-5" />
                                <span>Assignation Manuelle</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigator.clipboard.writeText(discovery.ip_address)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20"
                        >
                            <ClipboardIcon className="w-5 h-5" />
                            <span>Copier IP</span>
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                            <span>Actualiser</span>
                        </button>
                        <Link 
                            href={route('discovery.index')}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span>Retour à la Découverte</span>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Découverte d'Appareil - ${discovery.ip_address}`} />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Status Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20">
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3">
                                    <GlobeAltIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{discovery.ip_address}</div>
                                    <div className="text-gray-400">Adresse IP</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-green-500/20">
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg mr-3">
                                    <CheckCircleIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-400">
                                        {discovery.is_alive ? 'En Ligne' : 'Hors Ligne'}
                                    </div>
                                    <div className="text-gray-400">Statut</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-purple-500/20">
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
                                    <CpuChipIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-400">
                                        {discovery.snmp_available ? 'Disponible' : 'Indisponible'}
                                    </div>
                                    <div className="text-gray-400">SNMP</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column - Device Information */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Device Details Card */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                                        <ComputerDesktopIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                        Device Information
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                                            <span className="text-gray-400">Discovery Status:</span>
                                            {getStatusBadge(discovery.discovery_status)}
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                                            <span className="text-gray-400">Network Status:</span>
                                            {getAliveBadge(discovery.is_alive)}
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                                            <span className="text-gray-400">SNMP Status:</span>
                                            {getSnmpBadge(discovery.snmp_available)}
                                        </div>
                                        
                                        {discovery.sys_name && (
                                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-gray-400 block mb-2">Nom du Système :</span>
                                                <span className="text-white font-medium">{discovery.sys_name}</span>
                                            </div>
                                        )}
                                        
                                        {discovery.sys_descr && (
                                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-gray-400 block mb-2">Description du Système :</span>
                                                <span className="text-white font-medium">{discovery.sys_descr}</span>
                                            </div>
                                        )}
                                        
                                        {discovery.sys_contact && (
                                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-gray-400 block mb-2">Contact Système :</span>
                                                <span className="text-white font-medium">{discovery.sys_contact}</span>
                                            </div>
                                        )}
                                        
                                        {discovery.sys_object_id && (
                                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-gray-400 block mb-2">ID Objet Système :</span>
                                                <span className="text-white font-mono text-sm">{discovery.sys_object_id}</span>
                                            </div>
                                        )}
                                        
                                        {discovery.sys_location && (
                                            <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                                <span className="text-gray-400 block mb-2">Emplacement :</span>
                                                <span className="text-white flex items-center">
                                                    <MapPinIcon className="w-4 h-4 mr-2 text-cyan-400" />
                                                    {discovery.sys_location}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {discovery.error_message && (
                                            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                                <span className="text-red-400 block mb-2">Message d&apos;Erreur :</span>
                                                <span className="text-red-300">{discovery.error_message}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Discovery Timeline Card */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                                        <CalendarIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                        Discovery Timeline
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center p-3 bg-black/20 rounded-lg border border-white/5">
                                            <div className="bg-cyan-500/20 p-2 rounded-full mr-3">
                                                <ClockIcon className="w-4 h-4 text-cyan-400" />
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">Discovered At</div>
                                                <div className="text-gray-400 text-sm">
                                                    {new Date(discovery.discovered_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center p-3 bg-black/20 rounded-lg border border-white/5">
                                            <div className="bg-green-500/20 p-2 rounded-full mr-3">
                                                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">Record Created</div>
                                                <div className="text-gray-400 text-sm">
                                                    {new Date(discovery.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center p-3 bg-black/20 rounded-lg border border-white/5">
                                            <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                                                <ArrowPathIcon className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">Dernière Mise à Jour</div>
                                                <div className="text-gray-400 text-sm">
                                                    {new Date(discovery.updated_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Quick Info */}
                        <div className="space-y-6">
                            
                            {/* Device Type Analysis Card */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                                        <CpuChipIcon className="w-5 h-5 mr-2 text-cyan-400" />
                                        Analyse de l&apos;Appareil
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                            <div className="text-gray-400 text-sm">Type Détecté</div>
                                            <div className="text-white font-medium">
                                                {discovery.sys_descr ? 
                                                    (discovery.sys_descr.toLowerCase().includes('printer') ? 'Imprimante' :
                                                     discovery.sys_descr.toLowerCase().includes('switch') ? 'Commutateur Réseau' :
                                                     discovery.sys_descr.toLowerCase().includes('server') ? 'Serveur' :
                                                     discovery.sys_descr.toLowerCase().includes('windows') ? 'Poste Windows' :
                                                     discovery.sys_descr.toLowerCase().includes('linux') ? 'Système Linux' :
                                                     'Appareil Inconnu') : 'Inconnu'
                                                }
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                            <div className="text-gray-400 text-sm">SNMP Capability</div>
                                            <div className="text-white font-medium">
                                                {discovery.snmp_available ? 'Full SNMP Support' : 'Basic Ping Only'}
                                            </div>
                                        </div>
                                        
                                        <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                                            <div className="text-gray-400 text-sm">Network Response</div>
                                            <div className="text-white font-medium">
                                                {discovery.is_alive ? 'Responsive' : 'No Response'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Assignment Modal */}
            {showAssignmentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black/90 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-white flex items-center">
                                <BuildingOfficeIcon className="w-5 h-5 mr-2 text-blue-400" />
                                Assignation Manuelle de l&apos;Appareil
                            </h3>
                            <button
                                onClick={() => setShowAssignmentModal(false)}
                                className="text-gray-400 hover:text-white transition-colors duration-200"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* IP Address Display */}
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="text-blue-400 text-sm mb-1">IP de l&apos;Appareil</div>
                                <div className="text-white font-mono">{discovery.ip_address}</div>
                            </div>

                            {/* Department Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Département * ({departments ? departments.length : 0} disponible(s))
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Sélectionner un Département</option>
                                    {departments && departments.length > 0 ? (
                                        departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Aucun département disponible</option>
                                    )}
                                </select>
                            </div>

                            {/* Unit Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Unité * ({units ? units.length : 0} disponible(s))
                                </label>
                                <select
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Sélectionner une Unité</option>
                                    {units && units.length > 0 ? (
                                        units
                                            .filter(unit => !selectedDepartment || unit.department_id == selectedDepartment)
                                            .map((unit) => (
                                                <option key={unit.id} value={unit.id}>
                                                    {unit.name}
                                                </option>
                                            ))
                                    ) : (
                                        <option value="" disabled>Aucune unité disponible</option>
                                    )}
                                </select>
                            </div>

                            {/* User Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nom d&apos;Utilisateur (Optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="Entrer le nom d'utilisateur"
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Asset Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Numéro d&apos;Inventaire (Optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={assetNumber}
                                    onChange={(e) => setAssetNumber(e.target.value)}
                                    placeholder="Entrer le numéro d'inventaire"
                                    className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div className="text-red-400 text-sm">{errorMessage}</div>
                                </div>
                            )}

                            {/* Success Message */}
                            {successMessage && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <div className="text-green-400 text-sm">{successMessage}</div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => setShowAssignmentModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleManualAssignment}
                                    disabled={isAssigning || !selectedDepartment || !selectedUnit}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {isAssigning ? (
                                        <>
                                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                                            Attribution en cours...
                                        </>
                                    ) : (
                                        <>
                                            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                                            Attribuer l&apos;Appareil
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
