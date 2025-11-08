import React, { useState, useEffect } from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    PlusIcon, 
    EyeIcon, 
    PencilSquareIcon, 
    TrashIcon,
    BuildingOfficeIcon,
    ComputerDesktopIcon,
    Squares2X2Icon,
    UsersIcon,
    MagnifyingGlassIcon,
    ArrowTrendingUpIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

export default function Index({ auth, departments }) {
    const { delete: destroy } = useForm();
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Simulate loading and animate content on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = (department) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le département "${department.name}" ?`)) {
            destroy(route('departments.destroy', department.id));
        }
    };

    const filteredDepartments = departments.filter(department =>
        department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Departments...</div>
                        <div className="text-gray-400 mt-2">Organizing your company structure</div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <BuildingOfficeIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Department Management</p>
                            <h2 className="text-2xl font-bold text-white">
                                Gestion des Départements
                            </h2>
                        </div>
                    </div>
                    <Link
                        href={route('departments.create')}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nouveau Département
                    </Link>
                </div>
            }
        >
            <Head title="Départements" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Search Section */}
                    <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par nom ou description..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {filteredDepartments.length === 0 ? (
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-12 text-center">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                    <BuildingOfficeIcon className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Aucun département trouvé
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    {searchTerm ? 'Aucun département ne correspond à votre recherche.' : 'Commencez par créer un nouveau département.'}
                                </p>
                                <Link
                                    href={route('departments.create')}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-flex items-center gap-2"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Nouveau Département
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredDepartments.map((department, index) => (
                                        <div 
                                            key={department.id} 
                                            className={`bg-black/20 border border-white/10 rounded-lg shadow-sm hover:shadow-lg transition-all duration-500 transform hover:scale-105 cursor-pointer backdrop-blur-sm ${
                                                hoveredCard === department.id ? 'ring-2 ring-cyan-500/50' : ''
                                            }`}
                                            onMouseEnter={() => setHoveredCard(department.id)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                        >
                                            <div className="p-6">
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg transition-all duration-300 transform hover:rotate-12">
                                                            <BuildingOfficeIcon className="h-6 w-6 text-white" />
                                                        </div>
                                                        <h3 className="ml-3 text-lg font-semibold text-white">
                                                            {department.name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                {department.description && (
                                                    <p className="text-sm text-gray-400 mb-4">
                                                        {department.description}
                                                    </p>
                                                )}

                                                {/* Stats */}
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center">
                                                            <ComputerDesktopIcon className="h-5 w-5 text-green-400 mr-1" />
                                                            <span className="text-2xl font-bold text-green-400">
                                                                {department.devices_count || 0}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Appareils</p>
                                                        <div className="mt-2 flex items-center justify-center text-xs text-green-400">
                                                            <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                                            <span>Active</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="flex items-center justify-center">
                                                            <Squares2X2Icon className="h-5 w-5 text-blue-400 mr-1" />
                                                            <span className="text-2xl font-bold text-blue-400">
                                                                {department.uniteMateriels_count || 0}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Unités Matériel</p>
                                                        <div className="mt-2 flex items-center justify-center text-xs text-blue-400">
                                                            <BoltIcon className="h-3 w-3 mr-1" />
                                                            <span>Organized</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex justify-between space-x-2">
                                                    <Link
                                                        href={route('departments.show', department.id)}
                                                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 hover:scale-105"
                                                    >
                                                        <EyeIcon className="h-4 w-4 mr-1" />
                                                        Voir
                                                    </Link>
                                                    <Link
                                                        href={route('departments.edit', department.id)}
                                                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 hover:scale-105"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                                                        Modifier
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(department)}
                                                        className="inline-flex items-center px-3 py-2 border border-red-500/30 shadow-sm text-sm leading-4 font-medium rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 hover:scale-105"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
