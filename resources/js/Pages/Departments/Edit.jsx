import React, { useState, useEffect } from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon,
    BuildingOfficeIcon,
    PencilSquareIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ComputerDesktopIcon,
    Squares2X2Icon,
    BoltIcon
} from '@heroicons/react/24/outline';

export default function Edit({ auth, department }) {
    const { data, setData, put, processing, errors } = useForm({
        name: department.name || '',
        description: department.description || '',
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
        put(route('departments.update', department.id));
    };

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Form...</div>
                        <div className="text-gray-400 mt-2">Preparing department editing</div>
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
                        href={route('departments.index')}
                        className="mr-4 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-white" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <BuildingOfficeIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Department Editing</p>
                            <h2 className="text-2xl font-bold text-white">
                                Modifier le Département: {department.name}
                            </h2>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Modifier: ${department.name}`} />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
                                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                    Modifier les Informations du Département
                                </h3>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Name Field */}
                                <div>
                                    <label 
                                        htmlFor="name" 
                                        className="block text-sm font-medium text-gray-300 mb-2"
                                    >
                                        Nom du Département *
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
                                        placeholder="Ex: Département Informatique"
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
                                        placeholder="Description optionnelle du département..."
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                                    )}
                                </div>

                                {/* Current Stats */}
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                                    <h4 className="text-sm font-medium text-white mb-3">
                                        Statistiques Actuelles
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-400">
                                                {department.devices_count || 0}
                                            </div>
                                            <div className="text-sm text-gray-400">Appareils</div>
                                            <div className="mt-1 flex items-center justify-center text-xs text-blue-400">
                                                <ComputerDesktopIcon className="h-3 w-3 mr-1" />
                                                <span>Connected</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-400">
                                                {department.unite_materiels_count || 0}
                                            </div>
                                            <div className="text-sm text-gray-400">Unités Matériel</div>
                                            <div className="mt-1 flex items-center justify-center text-xs text-purple-400">
                                                <Squares2X2Icon className="h-3 w-3 mr-1" />
                                                <span>Organized</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                                    <Link
                                        href={route('departments.show', department.id)}
                                        className="inline-flex items-center px-4 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105"
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

                    {/* Warning Section */}
                    {(department.devices_count > 0 || department.unite_materiels_count > 0) && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-3">
                                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-400 mb-2">
                                        ⚠️ Attention
                                    </h4>
                                    <p className="text-sm text-yellow-300">
                                        Ce département contient des appareils et/ou des unités matériel. 
                                        La modification du nom peut affecter l'organisation de vos équipements.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Section */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-blue-400 mb-3">
                                    Aide - Modification d'un Département
                                </h4>
                                <ul className="text-sm text-blue-300 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-blue-400" />
                                        <span>Le nom du département doit rester unique</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-blue-400" />
                                        <span>Les appareils et unités matériel resteront associés à ce département</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-blue-400" />
                                        <span>Vous pouvez modifier la description à tout moment</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BoltIcon className="h-4 w-4 text-blue-400" />
                                        <span>Utilisez le bouton "Voir" pour consulter les détails avant modification</span>
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
