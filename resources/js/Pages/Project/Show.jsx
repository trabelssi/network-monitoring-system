import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from '@inertiajs/react';
import ProjectTasksTable from "@/Components/ProjectTasksTable";
import { PlusIcon, UserIcon, WrenchIcon, ClockIcon, DocumentTextIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export default function Show({ auth, project, tasks, success }) {
    return (
        <>
            <Head title={`Machine "${project.name}"`} />

            <AuthenticatedLayout
                user={auth.user}
                header={
                    <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                                <WrenchIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Machine</p>
                                <h2 className="text-2xl font-bold text-white">
                                    {project.name}
                            </h2>
                            </div>
                        </div>
                        <Link 
                            href={route('projects.edit', project.id)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                        >
                            Modifier la machine
                        </Link>
                    </div>
                }
            >
                <div className="py-6">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                        {/* Main Info Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Image Card */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        {project.image_path ? (
                                <img
                                    src={project.image_path}
                                    alt="Machine"
                                        className="w-full h-48 object-cover rounded-lg"
                                />
                        ) : (
                                    <div className="w-full h-48 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center text-gray-400">
                                <span>Aucune image disponible</span>
                            </div>
                        )}
                                    </div>

                            {/* Details Card */}
                            <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 lg:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-gray-400">Référence</label>
                                            <p className="text-white font-medium">{project.reference}</p>
                                    </div>
                                        <div>
                                            <label className="text-sm text-gray-400">Créé par</label>
                                            <p className="text-white font-medium">{project.createdBy.name}</p>
                                                </div>
                                        <div>
                                            <label className="text-sm text-gray-400">Date de création</label>
                                            <p className="text-white font-medium">{project.created_at}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Description</label>
                                        <p className="text-white mt-2">{project.description || "Aucune description disponible"}</p>
                                    </div>
                                </div>
                            </div>
                                    </div>

                        {/* Members Section */}
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <UserIcon className="h-5 w-5 text-cyan-400" />
                                <h3 className="text-lg font-medium text-white">Membres de l'équipe</h3>
                            </div>
                            {project.members && project.members.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {project.members.map((member) => (
                                        <div 
                                            key={member.id}
                                            className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-3 hover:bg-white/10 transition-colors duration-200"
                                        >
                                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-full">
                                                <UserIcon className="h-4 w-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">{member.name}</h4>
                                                {member.role && (
                                                    <p className="text-sm text-gray-400">{member.role}</p>
                                                )}
                                    </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400">Aucun membre assigné à cette machine</p>
                            )}
                            </div>

                        {/* Products Section */}
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Produits associés</h3>
                            {project.products && project.products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {project.products.map((product) => (
                                        <div 
                                            key={product.id}
                                            className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200"
                                        >
                                            <h4 className="text-cyan-400 font-medium">{product.name}</h4>
                                            {product.reference && (
                                                <p className="text-sm text-gray-400 mt-1">Ref: {product.reference}</p>
                                            )}
                            </div>
                                    ))}
                            </div>
                            ) : (
                                <p className="text-gray-400">Aucun produit associé à cette machine</p>
                            )}
                </div>

                        {/* Tickets Section */}
                        <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-medium text-white">Liste des tickets</h3>
                                    <p className="text-sm text-gray-400 mt-1">Gérez les tickets associés à cette machine</p>
                                </div>
                                <Link
                                    href={route('task.create', { 
                                        project_id: project.id,
                                        project_name: project.name,
                                        members: project.members?.map(member => member.id).join(',')
                                    })}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Nouveau ticket
                                </Link>
                            </div>

                            <ProjectTasksTable 
                                tasks={tasks} 
                                auth={auth}
                            />
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
