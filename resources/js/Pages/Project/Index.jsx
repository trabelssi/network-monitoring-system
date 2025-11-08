import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, router, Link, usePage} from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import { 
    PencilSquareIcon, 
    TrashIcon, 
    PlusIcon,
    MagnifyingGlassIcon,
    WrenchIcon,
    HashtagIcon,
    CalendarIcon,
    UserIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

export default function Index({ auth, projects, queryParams = null, success }) {
    const [deletingId, setDeletingId] = useState(null);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const { errors } = usePage().props;
    queryParams = queryParams || {};

    useEffect(() => {
        if (errors.error) {
            alert(errors.error);
        }
    }, [errors]);

    const searchFieldChange = (name, value) => {
        if (searchTimeout) clearTimeout(searchTimeout);
        
        setSearchTimeout(setTimeout(() => {
            const newParams = { ...queryParams };
       if (value) {
                newParams[name] = value;
        } else {
                delete newParams[name];
        }

            router.get(route('projects.index'), newParams, {
                preserveState: true,
                preserveScroll: true,
                only: ['projects', 'queryParams']
            });
        }, 300));
    };

        const deleteProject = (project) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette machine ?')) {
                return;
            }   
        
        setDeletingId(project.id);
        router.delete(route('projects.destroy', project.id), {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
            onError: () => {
                alert('Une erreur est survenue lors de la suppression de la machine.');
        }
        });
    };

    const handlePagination = useCallback((url) => {
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['projects', 'queryParams']
        });
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                    <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <WrenchIcon className="h-8 w-8 text-white" />
                            </div>
                        <div>
                            <p className="text-sm text-gray-400">Gestion des machines</p>
                            <h2 className="text-2xl font-bold text-white">
                                Liste des Machines
                            </h2>
                        </div>
                    </div>
                    <Link 
                        href={route('projects.create')}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                    >
                            <PlusIcon className="w-5 h-5" />
                        Nouvelle machine
                         </Link>
                    </div>
            }
        >
            <Head title="Machines" /> 

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {success && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 rounded-xl backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-emerald-400 font-medium">{success}</p>
                            </div>
                        </div>
                    )}   

                    <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
                        {/* Search Section */}
                        <div className="p-4 bg-black/20 border-b border-white/10">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <TextInput 
                                        className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                        defaultValue={queryParams.name}
                                        placeholder="Rechercher par nom..."
                                        onChange={e => searchFieldChange('name', e.target.value)}
                                        icon={<MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />}
                                    />
                                </div>
                                <div className="flex-1">
                                    <TextInput 
                                        className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
                                        defaultValue={queryParams.reference}
                                        placeholder="Rechercher par référence..."
                                        onChange={e => searchFieldChange('reference', e.target.value)}
                                        icon={<HashtagIcon className="w-5 h-5 text-gray-400" />}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-black/20 border-b border-white/10">
                                        <th className="px-4 py-3 text-left">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                <HashtagIcon className="w-4 h-4" />
                                                    ID
                                                </div>
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <WrenchIcon className="w-4 h-4" />
                                                Machine
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                <HashtagIcon className="w-4 h-4" />
                                                Référence
                                                </div>
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <CalendarIcon className="w-4 h-4" />
                                                Créé le
                                                </div>
                                        </th>
                                        <th className="px-4 py-3 text-left">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                    <UserIcon className="w-4 h-4" />
                                                    Créé par
                                                </div>
                                            </th>
                                        <th className="px-4 py-3 text-center w-32">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {projects.data.map((project) => (
                                        <tr 
                                            key={project.id}
                                            className="hover:bg-white/5 transition-colors duration-200"
                                        >
                                            <td className="px-4 py-3 text-gray-400">
                                                {project.id}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link 
                                                    href={route('projects.show', project.id)} 
                                                    className="text-white hover:text-cyan-400 transition-colors duration-200 font-medium"
                                            >
                                                    {project.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {project.reference || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {project.created_at}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {project.createdBy?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link 
                                                        href={route('projects.show', project.id)} 
                                                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors duration-200"
                                                    >
                                                        <EyeIcon className="w-4 h-4" />
                                                    </Link>
                                                        <Link 
                                                            href={route('projects.edit', project.id)} 
                                                        className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors duration-200"
                                                        >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                        </Link>
                                                        <button 
                                                        onClick={() => deleteProject(project)}
                                                        disabled={deletingId === project.id}
                                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                        {deletingId === project.id ? (
                                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : (
                                                            <TrashIcon className="w-4 h-4" />
                                                        )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-white/10">
                            <Pagination 
                                links={projects.meta.links} 
                                onClick={handlePagination}
                                showSpinnerOnClick={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

    //**<img src={project.image_path} style={ {width: 60}}/> */


    //**{(() => {
      //**  const rawStatus = project.status || '';
       //** const normalizedStatus = rawStatus.trim().toLowerCase().replace(/\s+/g, '_');

         //** return (
        //**<span className={`px-2 py-1 rounded text-white text-sm ${PROJECT_STATUS_CLASS_MAP[normalizedStatus] || 'bg-blue-500'}`}>
        //** {PROJECT_STATUS_TEXT_MAP[normalizedStatus] || rawStatus}
        //**</span>
       //** );
    //** })()}