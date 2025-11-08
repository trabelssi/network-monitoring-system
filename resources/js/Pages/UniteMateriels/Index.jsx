import React, { useState, useEffect } from 'react';
import { Link, Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    PlusIcon, 
    EyeIcon, 
    PencilSquareIcon, 
    TrashIcon,
    Squares2X2Icon,
    ComputerDesktopIcon,
    BuildingOfficeIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ArrowTrendingUpIcon,
    BoltIcon,
    SignalIcon
} from '@heroicons/react/24/outline';

export default function Index({ auth, uniteMateriels, departments }) {
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { delete: destroy } = useForm();

    // Simulate loading and animate content on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = (uniteMatériel) => {
        if (uniteMatériel.devices_count > 0) {
            alert('Impossible de supprimer une unité matériel contenant des appareils.');
            return;
        }
        
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'unité matériel "${uniteMatériel.name}" ?`)) {
            destroy(route('unite-materiels.destroy', { unite_materiel: uniteMatériel.id }));
        }
    };

    // Filter units by selected department and search term
    const filteredUnites = (uniteMateriels || []).filter(unite => {
        const matchesDepartment = !selectedDepartment || unite.department_id == selectedDepartment;
        const matchesSearch = !searchTerm || 
            unite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (unite.description && unite.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (unite.keywords && unite.keywords.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesDepartment && matchesSearch;
    });

    if (isLoading) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <div className="text-2xl font-semibold text-white">Loading Units...</div>
                        <div className="text-gray-400 mt-2">Organizing material units and departments</div>
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
                            <Squares2X2Icon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Material Units Management</p>
                            <h2 className="text-2xl font-bold text-white">
                                Gestion des Unités Matériel
                            </h2>
                        </div>
                    </div>
                    <Link
                        href={route('unite-materiels.create')}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nouvelle Unité Matériel
                    </Link>
                </div>
            }
        >
            <Head title="Unités Matériel" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Search and Filter Section */}
                    <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher par nom, description ou mots-clés..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-300">Département:</span>
                                </div>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                                >
                                    <option value="">Tous les départements</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-sm text-gray-400">
                                    ({filteredUnites.length} résultat{filteredUnites.length !== 1 ? 's' : ''})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <div className="text-2xl font-bold text-purple-400">{uniteMateriels.length}</div>
                                    <div className="text-sm text-gray-400">Total Unités</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-purple-400">
                                        <Squares2X2Icon className="h-3 w-3 mr-1" />
                                        <span>Organized</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <div className="text-2xl font-bold text-blue-400">{departments.length}</div>
                                    <div className="text-sm text-gray-400">Départements</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-blue-400">
                                        <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                        <span>Active</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <div className="text-2xl font-bold text-green-400">
                                        {uniteMateriels.reduce((sum, unite) => sum + (unite.devices_count || 0), 0)}
                                    </div>
                                    <div className="text-sm text-gray-400">Total Appareils</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-green-400">
                                        <SignalIcon className="h-3 w-3 mr-1" />
                                        <span>Connected</span>
                                    </div>
                                </div>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 transform hover:scale-105">
                                    <div className="text-2xl font-bold text-orange-400">
                                        {(uniteMateriels || []).filter(unite => (unite.devices_count || 0) === 0).length}
                                    </div>
                                    <div className="text-sm text-gray-400">Unités Vides</div>
                                    <div className="mt-2 flex items-center justify-center text-xs text-orange-400">
                                        <BoltIcon className="h-3 w-3 mr-1" />
                                        <span>Available</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {filteredUnites.length === 0 ? (
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-12 text-center">
                                <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                    <Squares2X2Icon className="h-10 w-10 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {selectedDepartment ? 'Aucune unité matériel dans ce département' : 'Aucune unité matériel trouvée'}
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    {selectedDepartment 
                                        ? 'Ce département ne contient pas encore d\'unités matériel.' 
                                        : searchTerm 
                                            ? 'Aucune unité ne correspond à votre recherche.'
                                            : 'Commencez par créer une nouvelle unité matériel.'
                                    }
                                </p>
                                <Link
                                    href={route('unite-materiels.create')}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-flex items-center gap-2"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Nouvelle Unité Matériel
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredUnites.map((uniteMatériel) => (
                                        <div 
                                            key={uniteMatériel.id} 
                                            className={`bg-black/20 border border-white/10 rounded-lg shadow-sm hover:shadow-lg transition-all duration-500 transform hover:scale-105 cursor-pointer backdrop-blur-sm ${
                                                hoveredCard === uniteMatériel.id ? 'ring-2 ring-cyan-500/50' : ''
                                            }`}
                                            onMouseEnter={() => setHoveredCard(uniteMatériel.id)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                        >
                                            <div className="p-6">
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <div className="bg-gradient-to-r from-purple-500 to-violet-500 p-2 rounded-lg transition-all duration-300 transform hover:rotate-12">
                                                            <Squares2X2Icon className="h-6 w-6 text-white" />
                                                        </div>
                                                        <h3 className="ml-3 text-lg font-semibold text-white">
                                                            {uniteMatériel.name}
                                                        </h3>
                                                    </div>
                                                </div>

                                                {/* Department */}
                                                <div className="flex items-center mb-3">
                                                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-2">
                                                        <BuildingOfficeIcon className="h-4 w-4 text-white" />
                                                    </div>
                                                    <span className="text-sm text-blue-400 font-medium">
                                                        {uniteMatériel.department ? uniteMatériel.department.name : 'Département inconnu'}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                {uniteMatériel.description && (
                                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                                        {uniteMatériel.description}
                                                    </p>
                                                )}

                                                {/* Keywords */}
                                                {uniteMatériel.keywords && (
                                                    <div className="mb-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {uniteMatériel.keywords_array?.slice(0, 3).map((keyword, index) => (
                                                                <span 
                                                                    key={index}
                                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                                                >
                                                                    {keyword.trim()}
                                                                </span>
                                                            ))}
                                                            {uniteMatériel.keywords_array?.length > 3 && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
                                                                    +{uniteMatériel.keywords_array.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Device Count */}
                                                <div className="flex items-center justify-center mb-6 bg-black/30 rounded-lg p-4">
                                                    <ComputerDesktopIcon className="h-6 w-6 text-green-400 mr-2" />
                                                    <span className="text-2xl font-bold text-green-400">
                                                        {uniteMatériel.devices_count || 0}
                                                    </span>
                                                    <span className="ml-2 text-sm text-gray-400">
                                                        appareil{(uniteMatériel.devices_count || 0) !== 1 ? 's' : ''}
                                                    </span>
                                                    <div className="mt-2 flex items-center justify-center text-xs text-green-400">
                                                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                                        <span>Active</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex justify-between space-x-2">
                                                    <Link
                                                        href={route('unite-materiels.show', { unite_materiel: uniteMatériel.id })}
                                                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 hover:scale-105"
                                                    >
                                                        <EyeIcon className="h-4 w-4 mr-1" />
                                                        Voir
                                                    </Link>
                                                    <Link
                                                        href={route('unite-materiels.edit', { unite_materiel: uniteMatériel.id })}
                                                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-white/20 shadow-sm text-sm leading-4 font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 hover:scale-105"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                                                        Modifier
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(uniteMatériel)}
                                                        disabled={uniteMatériel.devices_count > 0}
                                                        className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 hover:scale-105 ${
                                                            uniteMatériel.devices_count > 0
                                                                ? 'border-white/20 text-gray-400 bg-black/20 cursor-not-allowed'
                                                                : 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 focus:ring-red-500'
                                                        }`}
                                                        title={uniteMatériel.devices_count > 0 ? 'Impossible de supprimer une unité contenant des appareils' : 'Supprimer cette unité'}
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
