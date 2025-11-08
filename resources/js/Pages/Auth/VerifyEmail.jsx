import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="GLPI - Vérification de l'email" />

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
                Vérifier l'email
            </h1>

            <div className="mb-4 text-sm text-white/80">
                Merci de vous être inscrit ! Avant de commencer, pourriez-vous vérifier votre adresse e-mail en cliquant sur le lien que nous venons de vous envoyer ? Si vous n'avez pas reçu l'e-mail, nous vous en enverrons un autre avec plaisir.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-400">
                    Un nouveau lien de vérification a été envoyé à l'adresse e-mail que vous avez fournie lors de l'inscription.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-6 flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                    >
                        Renvoyer l'email de vérification
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
