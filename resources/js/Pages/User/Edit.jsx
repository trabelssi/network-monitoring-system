import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head , useForm} from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import {Link} from '@inertiajs/react';


export default function Create({auth ,user  }) {
  const {data , setData , post , errors, reset} = useForm({
    
    name: user.name||"",
    password:"",
    email: user.email||"",
    password_confirmation:"",
    _method: 'PUT',

  })

    const onSubmit = (e) => {
        e.preventDefault()
        post(route('user.update',user.id), {
            data: data,
            onSuccess: () => reset(),
            onError: () => console.log(errors),
        })
    };
    return (
        <AuthenticatedLayout
        user = {auth.user}
        header={
                <div className="flex justify-between items-center">

                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Modifier l'Utilisateur {user.name}
                    </h2>

                    
                </div>
        }
    >

<Head title="Utilisateurs" />

<div className="py-12">
    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="overflow-hidden bg-white shadow-xl sm:rounded-lg dark:bg-gray-800 transition-all duration-300 animate-fade-in">
            <form onSubmit={onSubmit} className='p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-fade-in'>
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Modifier l'Utilisateur
                    </h3>
                    <div className='mt-4'>
                         <InputLabel htmlFor="user_name" value="Nom d'Utilisateur"/>
                            <TextInput
                                id="user_name"
                                type="text"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full"
                                isFocused={true}
                                onChange={e => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} className="mt-2" />
                    </div>
                    
                    <div className='mt-4'>
                         <InputLabel htmlFor="user_email" value="Email d'Utilisateur"/>
                            <TextInput
                                id="user_email"
                                type="text"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                onChange={e => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                    </div>
                    
                    <div className='mt-4'>
                         <InputLabel htmlFor="user_password" value="Mot de Passe"/>
                            <TextInput
                                id="user_password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                onChange={e => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-2" />
                    </div>
                    
                    <div className='mt-4'>
                         <InputLabel htmlFor="user_password_confirmation" value="Confirmer le mot de passe"/>
                            <TextInput
                                id="user_password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full"
                                onChange={e => setData('password_confirmation', e.target.value)}
                                />
                                <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <Link 
                            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                            href={route('users.index')}
                        >
                            Annuler
                        </Link>
                        <button 
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                        >
                            Soumettre
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>
    </AuthenticatedLayout>

    )
}