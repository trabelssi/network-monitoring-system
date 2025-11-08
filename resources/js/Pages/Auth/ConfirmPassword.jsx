import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset(),
        });
    };

    return (
        <GuestLayout>
            <Head title="GLPI - Confirmer le mot de passe" />

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
                Confirmer le mot de passe
            </h1>

            <div className="mb-4 text-sm text-white/80">
                Ceci est une zone sécurisée de l'application. Veuillez confirmer votre mot de passe avant de continuer.
            </div>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="password" value="Mot de passe" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-6 flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                    >
                        Confirmer
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
