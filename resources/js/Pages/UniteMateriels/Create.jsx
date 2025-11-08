import React, { useState, useEffect } from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon,
    Squares2X2Icon,
    BuildingOfficeIcon,
    PlusIcon,
    BoltIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function Create({ auth, departments }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        department_id: '',
        keywords: '',
    });

    const [isLoading, setIsLoading] = useState(true);

    // Simulate loading and animate content on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('unite-materiels.store'));
    };

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Form...</div>
                        <div className="text-gray-400 mt-2">Preparing material unit creation</div>
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
                            <p className="text-sm text-gray-400">Material Unit Creation</p>
                            <h2 className="text-2xl font-bold text-white">
                                Créer une Nouvelle Unité Matériel
                            </h2>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Créer une Unité Matériel" />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <Squares2X2Icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    Informations de l'Unité Matériel
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
                                    {departments.length === 0 && (
                                        <p className="mt-1 text-sm text-yellow-400">
                                            ⚠️ Aucun département disponible. 
                                            <Link href={route('departments.create')} className="text-blue-400 hover:text-blue-300 underline ml-1">
                                                Créer un département d'abord
                                            </Link>
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

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                                    <Link
                                        href={route('unite-materiels.index')}
                                        className="inline-flex items-center px-4 py-2 border border-white/20 shadow-sm text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105"
                                    >
                                        Annuler
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing || departments.length === 0}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Création...
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon className="w-4 h-4 mr-2" />
                                                Créer l'Unité Matériel
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-purple-400 mb-3">
                                    Aide - Création d'une Unité Matériel
                                </h4>
                                <ul className="text-sm text-purple-300 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Une unité matériel doit appartenir à un département</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Le nom doit être descriptif de la catégorie d'équipements</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Exemples: "Équipements Réseau", "Serveurs", "Postes de Travail"</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>Après création, vous pourrez y assigner des appareils</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-purple-400" />
                                        <span>La description aide à clarifier l'usage de l'unité</span>
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
