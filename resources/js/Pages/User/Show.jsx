import { USER_STATUS_CLASS_MAP, USER_STATUS_TEXT_MAP } from '@/constants.jsx';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from '@inertiajs/react';
import TasksTable from "../Task/TasksTable";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from '@/Pages/User/Index.jsx';
import { ShieldCheckIcon, TrashIcon, ArrowPathIcon, EnvelopeIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function Show({ auth, user, tasks, queryParams }) {
    return (
        <>
            <Head title={`Utilisateur "${user.name}"`} />

            <AuthenticatedLayout
                user={auth.user}
                header={
                    <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                                {`Utilisateur "${user.name}"`}
                            </h2>
                        </div>
                    </div>
                }
            >
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="relative overflow-hidden rounded-2xl shadow-xl">
                            <img
                                src={user.image_path}
                                alt=""
                                className="w-full h-64 object-cover filter brightness-75"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                                <p className="text-gray-300 mt-1">{user.email}</p>
                            </div>
                        </div>

                        <div className="mt-6 bg-black/40 backdrop-blur-lg border border-white/10 overflow-hidden shadow-sm sm:rounded-lg p-6 transform transition-all duration-300 hover:scale-[1.01]">
                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <label className="text-sm font-medium text-gray-400">ID Utilisateur</label>
                                        <p className="mt-1 text-lg text-white">{user.id}</p>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <label className="text-sm font-medium text-gray-400">Nom d'Utilisateur</label>
                                        <p className="mt-1 text-lg text-white">{user.name}</p>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <label className="text-sm font-medium text-gray-400">Statut Utilisateur</label>
                                        <p className="mt-2">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${USER_STATUS_CLASS_MAP[user.status]}`}>
                                                {USER_STATUS_TEXT_MAP[user.status]}
                                            </span>
                                        </p>
                                    </div>
                                    
                                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <label className="text-sm font-medium text-gray-400">Créé Par</label>
                                        <p className="mt-1 text-lg text-white">{user.createdBy?.name ?? 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <label className="text-sm font-medium text-gray-400">Date de Création</label>
                                        <p className="mt-1 text-lg text-white">{user.created_at}</p>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <label className="text-sm font-medium text-gray-400">Mis à Jour Par</label>
                                        <p className="mt-1 text-lg text-white">{user.createdBy.name}</p>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                        <label className="text-sm font-medium text-gray-400">Date limite</label>
                                        <p className="mt-1 text-lg text-white">{user.due_date}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-black/20 p-4 rounded-lg border border-white/5">
                                <label className="text-sm font-medium text-gray-400">Description de l'Utilisateur</label>
                                <p className="mt-2 text-white">{user.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pb-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 overflow-hidden shadow-sm sm:rounded-lg p-6 transform transition-all duration-300 hover:scale-[1.01]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                                        Utilisateurs Désactivés
                                    </h3>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {deactivatedUsers?.total ?? 0} utilisateurs désactivés
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <div className="min-w-full divide-y divide-white/10">
                                    <div className="bg-black/20 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-white/10">
                                            <thead className="bg-gradient-to-r from-slate-800/80 via-slate-900/70 to-slate-800/80">
                                                <tr className="text-nowrap">
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="w-4 h-4" />
                                                            Nom
                                                        </div>
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <EnvelopeIcon className="w-4 h-4" />
                                                            Email
                                                        </div>
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <ShieldCheckIcon className="w-4 h-4" />
                                                            Rôle
                                                        </div>
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            Date de désactivation
                                                        </div>
                                                    </th>
                                                    <th className="px-3 py-2 text-gray-400">
                                                        <div className="flex items-center gap-2">Actions</div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10">
                                                {deactivatedUsers?.data?.length > 0 ? (
                                                    deactivatedUsers.data.map((user) => (
                                                        <tr key={user.id} className="bg-black/20 hover:bg-black/30 transition-colors duration-200 group">
                                                            <td className='px-3 py-2 text-left'>
                                                                <span className="text-cyan-400 group-hover:underline underline-offset-4 decoration-cyan-500/50 cursor-pointer">{user.name}</span>
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-300">{user.email}</td>
                                                            <td className="px-3 py-2">
                                                                <span className={`px-3 py-1 rounded-full text-sm border ${ROLE_BADGE_CLASSES[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-300">{user.deleted_at}</td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex gap-2 items-center">
                                                                    <button onClick={() => handleRestoreUser(user.id)} className="text-green-400 hover:text-green-300 transition-colors duration-200" title="Restaurer">
                                                                        <ArrowPathIcon className="w-5 h-5" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 transition-colors duration-200" title="Supprimer définitivement">
                                                                        <TrashIcon className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                            Aucun utilisateur désactivé
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {deactivatedUsers?.meta?.links && (
                                <div className="mt-6">
                                    <Pagination links={deactivatedUsers.meta.links} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
