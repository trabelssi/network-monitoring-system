import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="GLPI - Mot de passe oublié" />

            <h1 
                style={{ 
                    fontSize: 32, 
                    fontWeight: 800, 
                    marginBottom: 24,
                    background: 'linear-gradient(45deg, #2196F3, #64B5F6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'gradientShift 3s ease infinite',
                    position: 'relative',
                }}
            >
                Réinitialiser le mot de passe
            </h1>

            <div className="mb-4 text-sm text-white/80">
                Mot de passe oublié ? Pas de problème. Indiquez-nous votre adresse e-mail et nous vous enverrons un lien de réinitialisation qui vous permettra d'en choisir un nouveau.
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-400">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-6 flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                    >
                        Envoyer le lien de réinitialisation
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
