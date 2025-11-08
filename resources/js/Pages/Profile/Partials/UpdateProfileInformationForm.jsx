import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';

const inputVariants = {
    focus: { scale: 1.02, transition: { type: "spring", stiffness: 300 } }
};

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <motion.header
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="relative mb-8"
            >
                <motion.div
                    className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent relative">
                    Informations du Profil
                </h2>

                <p className="mt-2 text-sm text-gray-400 leading-relaxed max-w-2xl">
                    Mettez à jour les informations de profil et l'adresse e-mail de votre compte.
                    Assurez-vous d'utiliser une adresse e-mail valide pour recevoir les notifications importantes.
                </p>
            </motion.header>

            <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative group"
                    >
                        <InputLabel htmlFor="name" value="Nom" className="text-gray-300 text-lg mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span>Nom</span>
                        </InputLabel>

                        <motion.div variants={inputVariants} whileFocus="focus" className="relative">
                            <TextInput
                                id="name"
                                className="mt-1 block w-full bg-black/40 border-2 border-white/10 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400 p-3"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                isFocused
                                autoComplete="name"
                            />
                            <InputError className="mt-2" message={errors.name} />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative group"
                    >
                        <InputLabel htmlFor="email" value="Email" className="text-gray-300 text-lg mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <span>Email</span>
                        </InputLabel>

                        <motion.div variants={inputVariants} whileFocus="focus" className="relative">
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1 block w-full bg-black/40 border-2 border-white/10 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400 p-3"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                            />
                            <InputError className="mt-2" message={errors.email} />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative group"
                    >
                        <InputLabel htmlFor="phone" value="Téléphone" className="text-gray-300 text-lg mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <span>Téléphone</span>
                        </InputLabel>

                        <motion.div variants={inputVariants} whileFocus="focus" className="relative">
                            <TextInput
                                id="phone"
                                type="tel"
                                className="mt-1 block w-full bg-black/40 border-2 border-white/10 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400 p-3"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="+216 XXXXXXXX"
                                autoComplete="tel"
                            />
                            <p className="mt-1 text-sm text-gray-400">Format: +216 suivi de 8 chiffres (ex: +216 20123456)</p>
                            <InputError className="mt-2" message={errors.phone} />
                        </motion.div>
                    </motion.div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-6 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 bg-blue-500/20 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-300">
                                    Votre adresse e-mail n'est pas vérifiée.
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="ml-2 underline text-sm text-cyan-400 hover:text-cyan-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-300"
                                    >
                                        Cliquez ici pour renvoyer l'e-mail de vérification.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 font-medium text-sm text-green-400 flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Un nouveau lien de vérification a été envoyé à votre adresse e-mail.
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                <motion.div 
                    className="flex items-center justify-end gap-4 pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <PrimaryButton
                        className={`relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 ${
                            processing && 'opacity-75 cursor-wait'
                        }`}
                        disabled={processing}
                    >
                        <span className="relative z-10">Enregistrer</span>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0"
                            whileHover={{ opacity: 0.2 }}
                            transition={{ duration: 0.3 }}
                        />
                    </PrimaryButton>

                    {recentlySuccessful && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Enregistré avec succès</span>
                        </motion.div>
                    )}
                </motion.div>
            </form>
        </section>
    );
}
