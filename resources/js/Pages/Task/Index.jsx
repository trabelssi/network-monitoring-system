import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head , Link} from '@inertiajs/react';
import TasksTable from './TasksTable';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function Index({ auth, tasks, projects, queryParams, success }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                            Liste des Tickets
                        </h2>
                    </div>
                    <Link 
                        href={route('task.create')}
                        className='bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20'
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="relative">
                            Ajouter un nouveau ticket
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </span>
                    </Link>
                </div>
            }
        >
            <Head title="Tickets" />
            <TasksTable 
                tasks={tasks} 
                projects={projects || []}
                queryParams={queryParams}
                success={success}
                auth={auth}
                currentRouteName="tasks.index"
            />
        </AuthenticatedLayout>
    );
}        
