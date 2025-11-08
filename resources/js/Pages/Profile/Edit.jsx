import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl max-w-5xl mx-auto"
                >
                    <div className="flex items-center gap-6">
                        <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-cyan-500/20 relative overflow-hidden group"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                                animate={{
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </motion.div>
                        <div>
                            <motion.h2 
                                className="text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent animate-gradient-x"
                                whileHover={{ scale: 1.02 }}
                            >
                                Profil
                            </motion.h2>
                            <p className="text-gray-400 mt-1">Gérez vos informations personnelles</p>
                        </div>
                    </div>
                </motion.div>
            }
        >
            <Head title="Profil" />

            <motion.div 
                className="py-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
                    <motion.div
                        variants={cardVariants}
                        className="bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl sm:rounded-3xl p-8 text-gray-100 transform transition-all duration-500 hover:shadow-cyan-500/10 hover:border-cyan-500/20 relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="relative z-10"
                        />
                    </motion.div>

                    <motion.div
                        variants={cardVariants}
                        className="bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl sm:rounded-3xl p-8 text-gray-100 transform transition-all duration-500 hover:shadow-blue-500/10 hover:border-blue-500/20 relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <UpdatePasswordForm className="relative z-10" />
                    </motion.div>

                    <motion.div
                        variants={cardVariants}
                        className="bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl sm:rounded-3xl p-8 text-gray-100 transform transition-all duration-500 hover:shadow-red-500/10 hover:border-red-500/20 relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <DeleteUserForm className="relative z-10" />
                    </motion.div>
                </div>
            </motion.div>
        </AuthenticatedLayout>
    );
}
