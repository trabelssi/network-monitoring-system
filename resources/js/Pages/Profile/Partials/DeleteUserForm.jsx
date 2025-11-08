import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-400 bg-clip-text text-transparent">
                    Désactiver le Compte
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                    Une fois votre compte désactivé, toutes vos ressources et données seront conservées mais vous ne pourrez plus vous connecter.
                    Vous pourrez demander à un administrateur de réactiver votre compte à tout moment.
                </p>
            </header>

            <DangerButton 
                onClick={confirmUserDeletion}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
            >
                Désactiver le Compte
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-400 bg-clip-text text-transparent">
                        Êtes-vous sûr de vouloir désactiver votre compte ?
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Veuillez entrer votre mot de passe pour confirmer que vous souhaitez désactiver votre compte.
                    </p>

                    <div className="mt-6">
                        <InputLabel htmlFor="password" value="Mot de passe" className="text-gray-300" />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 hover:border-red-400"
                            placeholder="Mot de passe"
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">
                            Annuler
                        </SecondaryButton>

                        <DangerButton 
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                            disabled={processing}
                        >
                            Désactiver le Compte
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
