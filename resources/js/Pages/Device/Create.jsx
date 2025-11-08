import React from 'react';
import { useForm, Link, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    PlusIcon, 
    ComputerDesktopIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function Create({ auth, departments, uniteMateriels }) {
    const { data, setData, post, processing, errors } = useForm({
        hostname: '',
        ip_address: '',
        sys_descr: '',
        sys_location: '',
        asset_number: '',
        user_name: '',
        department_id: '',
        unit_id: '',
        description: '',
        enabled: true,
        snmp_community: '',
        snmp_oid: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('devices.store'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <PlusIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Gestion des Équipements</p>
                            <h2 className="text-2xl font-bold text-white">Ajouter Nouvel Équipement</h2>
                        </div>
                    </div>
                    <Link 
                        href={route('devices.index')}
                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Retour à la Liste</span>
                    </Link>
                </div>
            }
        >
            <Head title="Ajouter Nouvel Équipement" />
            
            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Nom d'Hôte *
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.hostname} 
                                            onChange={e => setData('hostname', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer le nom d'hôte..."
                                            required
                                        />
                                        {errors.hostname && <div className="text-red-400 text-sm mt-1">{errors.hostname}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Adresse IP *
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.ip_address} 
                                            onChange={e => setData('ip_address', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer l'adresse IP..."
                                            required
                                        />
                                        {errors.ip_address && <div className="text-red-400 text-sm mt-1">{errors.ip_address}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Département *
                                        </label>
                                        <select 
                                            value={data.department_id} 
                                            onChange={e => setData('department_id', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            required
                                        >
                                            <option value="">Sélectionner un Département</option>
                                            {departments?.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        {errors.department_id && <div className="text-red-400 text-sm mt-1">{errors.department_id}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Unité Matériel
                                        </label>
                                        <select 
                                            value={data.unit_id} 
                                            onChange={e => setData('unit_id', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                                        >
                                            <option value="">Sélectionner une Unité Matériel</option>
                                            {uniteMateriels?.filter(unit => unit.department_id == data.department_id).map(unit => (
                                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                                            ))}
                                        </select>
                                        {errors.unit_id && <div className="text-red-400 text-sm mt-1">{errors.unit_id}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Numéro d'Inventaire
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.asset_number} 
                                            onChange={e => setData('asset_number', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer le numéro d'inventaire..."
                                        />
                                        {errors.asset_number && <div className="text-red-400 text-sm mt-1">{errors.asset_number}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Nom d'Utilisateur
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.user_name} 
                                            onChange={e => setData('user_name', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer le nom d'utilisateur..."
                                        />
                                        {errors.user_name && <div className="text-red-400 text-sm mt-1">{errors.user_name}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Description Système
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.sys_descr} 
                                            onChange={e => setData('sys_descr', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer la description système..."
                                        />
                                        {errors.sys_descr && <div className="text-red-400 text-sm mt-1">{errors.sys_descr}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Localisation Système
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.sys_location} 
                                            onChange={e => setData('sys_location', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer la localisation système..."
                                        />
                                        {errors.sys_location && <div className="text-red-400 text-sm mt-1">{errors.sys_location}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Communauté SNMP
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.snmp_community} 
                                            onChange={e => setData('snmp_community', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer la communauté SNMP..."
                                        />
                                        {errors.snmp_community && <div className="text-red-400 text-sm mt-1">{errors.snmp_community}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            OID SNMP
                                        </label>
                                        <input 
                                            type="text" 
                                            value={data.snmp_oid} 
                                            onChange={e => setData('snmp_oid', e.target.value)} 
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                            placeholder="Entrer l'OID SNMP..."
                                        />
                                        {errors.snmp_oid && <div className="text-red-400 text-sm mt-1">{errors.snmp_oid}</div>}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Description
                                    </label>
                                    <textarea 
                                        value={data.description} 
                                        onChange={e => setData('description', e.target.value)} 
                                        rows={4}
                                        className="w-full px-3 py-2 bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300" 
                                        placeholder="Entrer la description de l'équipement..."
                                    />
                                    {errors.description && <div className="text-red-400 text-sm mt-1">{errors.description}</div>}
                                </div>
                                
                                <div className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={data.enabled} 
                                        onChange={e => setData('enabled', e.target.checked)} 
                                        className="rounded border-white/10 text-cyan-500 focus:ring-cyan-500 bg-black/40"
                                    />
                                    <label className="ml-2 text-sm text-gray-400">Équipement Activé</label>
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4">
                                    <Link 
                                        href={route('devices.index')}
                                        className="px-4 py-2 text-sm font-medium text-gray-400 bg-black/40 border border-white/10 rounded-lg hover:bg-black/60 hover:text-white transition-all duration-300"
                                    >
                                        Annuler
                                    </Link>
                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                    >
                                        {processing ? 'Création...' : 'Créer Équipement'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 