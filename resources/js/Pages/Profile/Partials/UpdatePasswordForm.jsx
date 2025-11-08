import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';

export default function UpdatePasswordForm({ className = '' }) {
    const { data, setData, put, errors, reset, processing } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            onSuccess: () => reset(),
            onError: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Mettre à jour le mot de passe
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                    Assurez-vous que votre compte utilise un mot de passe long et aléatoire pour rester en sécurité.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="current_password" value="Mot de passe actuel" className="text-gray-300" />

                    <TextInput
                        id="current_password"
                        type="password"
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />

                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Nouveau mot de passe" className="text-gray-300" />

                    <TextInput
                        id="password"
                        type="password"
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirmer le mot de passe" className="text-gray-300" />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        Enregistrer
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
