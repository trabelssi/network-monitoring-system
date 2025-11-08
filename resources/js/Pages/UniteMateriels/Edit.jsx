import React, { useState, useEffect } from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon,
    Squares2X2Icon,
    BuildingOfficeIcon,
    ComputerDesktopIcon,
    PencilSquareIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

export default function Edit({ auth, uniteMatériel = {}, departments = [] }) {
    const [isLoading, setIsLoading] = useState(true);

    // Simulate loading and animate content on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    // Return loading state if uniteMatériel is not loaded
    if (!uniteMatériel.id) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Modification Unité Matériel - Sancella" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 text-white">
                                Loading...
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const { data, setData, put, processing, errors } = useForm({
        name: uniteMatériel.name || '',
        description: uniteMatériel.description || '',
        department_id: uniteMatériel.department_id || '',
        keywords: uniteMatériel.keywords || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (uniteMatériel.id) {
            put(route('unite-materiels.update', { unite_materiel: uniteMatériel.id }));
        }
    };

    const currentDepartment = departments.find(dept => dept.id === uniteMatériel.department_id);
    const devicesCount = uniteMatériel.devices_count || 0;

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Edit Form...</div>
                        <div className="text-gray-400 mt-2">Preparing material unit modification</div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
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
                            <p className="text-sm text-gray-400">Material Unit Modification</p>
                            <h2 className="text-2xl font-bold text-white">
                                Modifier l'Unité Matériel: {uniteMatériel.name}
                            </h2>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Modifier: ${uniteMatériel.name}`} />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <Squares2X2Icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    Modifier les Informations de l'Unité Matériel
                                </h3>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Department Field */}
                                <div>
                                    <label 
                                        htmlFor="department_id" 
                                        className="block text-sm font-medium text-gray-300 mb-2"
                                    >
                                        Département *
                                    </label>
                                    <div className="relative">
                                        <BuildingOfficeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <select
                                            id="department_id"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-black/40 border-white/10 text-white transition-all duration-300 ${
                                                errors.department_id 
                                                    ? 'border-red-500/50 text-red-400' 
                                                    : 'hover:border-white/20'
                                            }`}
                                            value={data.department_id}
                                            onChange={(e) => setData('department_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Sélectionner un département</option>
                                            {departments.map((department) => (
                                                <option key={department.id} value={department.id}>
                                                    {department.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.department_id && (
                                        <p className="mt-1 text-sm text-red-400">{errors.department_id}</p>
                                    )}
                                    {devicesCount > 0 && data.department_id !== uniteMatériel.department_id && (
                                        <p className="mt-1 text-sm text-yellow-400">
                                            ⚠️ Cette unité contient {devicesCount} appareil{devicesCount > 1 ? 's' : ''}. 
                                            Changer de département affectera l'organisation de ces appareils.
                                        </p>
                                    )}
                                </div>

                                {/* Name Field */}
                                <div>
                                    <label 
                                        htmlFor="name" 
                                        className="block text-sm font-medium text-gray-300 mb-2"
                                    >
                                        Nom de l'Unité Matériel *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-black/40 border-white/10 text-white placeholder-gray-500 transition-all duration-300 ${
                                            errors.name 
                                                ? 'border-red-500/50 text-red-400 placeholder-red-400/50' 
                                                : 'hover:border-white/20'
                                        }`}
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Ex: Équipements Réseau"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                                    )}
                                </div>

                                {/* Description Field */}
                                <div>
                                    <label 
                                        htmlFor="description" 
                                        className="block text-sm font-medium text-gray-300 mb-2"
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-black/40 border-white/10 text-white placeholder-gray-500 transition-all duration-300 ${
                                            errors.description 
                                                ? 'border-red-500/50 text-red-400 placeholder-red-400/50' 
                                                : 'hover:border-white/20'
                                        }`}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Description optionnelle de l'unité matériel..."
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                                    )}
                                </div>

                                {/* Keywords Field */}
                                <div>
                                    <label 
                                        htmlFor="keywords" 
                                        className="block text-sm font-medium text-gray-300 mb-2"
                                    >
                                        Mots-clés (Keywords)
                                    </label>
                                    <input
                                        id="keywords"
                                        type="text"
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-black/40 border-white/10 text-white placeholder-gray-500 transition-all duration-300 ${
                                            errors.keywords 
                                                ? 'border-red-500/50 text-red-400 placeholder-red-400/50' 
                                                : 'hover:border-white/20'
                                        }`}
                                        value={data.keywords}
                                        onChange={(e) => setData('keywords', e.target.value)}
                                        placeholder="Ex: réseau, serveur, poste travail"
                                    />
                                    {errors.keywords && (
                                        <p className="mt-1 text-sm text-red-400">{errors.keywords}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Mots-clés séparés par des virgules pour l'auto-classification des appareils
                                    </p>
                                </div>

                                {/* Current Stats */}
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <h4 className="text-sm font-medium text-white mb-3">
                                        Statistiques Actuelles
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mx-auto mb-2 w-12 h-12 flex items-center justify-center">
                                                <ComputerDesktopIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="text-2xl font-bold text-blue-400">{devicesCount}</div>
                                            <div className="text-sm text-gray-400">Appareils</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg mx-auto mb-2 w-12 h-12 flex items-center justify-center">
                                                <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="text-lg font-medium text-purple-400">
                                                {currentDepartment ? currentDepartment.name : 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-400">Département Actuel</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                                    <Link
                                        href={uniteMatériel.id ? route('unite-materiels.show', { unite_materiel: uniteMatériel.id }) : route('unite-materiels.index')}
                                        className="inline-flex items-center px-4 py-2 border border-white/20 shadow-sm text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Annuler
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Mise à jour...
                                            </>
                                        ) : (
                                            <>
                                                <PencilSquareIcon className="w-4 h-4 mr-2" />
                                                Mettre à jour
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Warnings */}
                    {devicesCount > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-400 mb-3">
                                        ⚠️ Attention
                                    </h4>
                                    <ul className="text-sm text-yellow-300 space-y-2">
                                        <li className="flex items-center gap-2">
                                            <BoltIcon className="h-4 w-4 text-yellow-400" />
                                            <span>Cette unité contient {devicesCount} appareil{devicesCount > 1 ? 's' : ''}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <BoltIcon className="h-4 w-4 text-yellow-400" />
                                            <span>Changer le département affectera l'organisation des appareils</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <BoltIcon className="h-4 w-4 text-yellow-400" />
                                            <span>Modifier le nom peut affecter la catégorisation des équipements</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <BoltIcon className="h-4 w-4 text-yellow-400" />
                                            <span>Consultez la page "Voir" pour vérifier les appareils avant modification</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Section */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-purple-400 mb-3">
                                    Aide - Modification d'une Unité Matériel
                                </h4>
                                <ul className="text-sm text-purple-300 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Une unité matériel doit toujours appartenir à un département</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Les appareils associés suivront les changements de département</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Le nom doit rester descriptif de la catégorie d'équipements</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Vous pouvez modifier la description à tout moment</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
