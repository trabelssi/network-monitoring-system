import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, useForm} from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import {Link} from '@inertiajs/react';

export default function Create({auth, roles}) {
  const {data, setData, post, errors, reset} = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user', // Default role
  });

  const onSubmit = (e) => {
    e.preventDefault();
    post(route('user.store'), {
      onSuccess: () => reset(),
      onError: () => console.log(errors),
    });
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Créer un Nouvel Utilisateur
          </h2>
        </div>
      }
    >
      <Head title="Créer Utilisateur" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-xl sm:rounded-lg dark:bg-gray-800">
            <form onSubmit={onSubmit} className="p-6 space-y-6">
              <div>
                <InputLabel htmlFor="name" value="Nom" />
                <TextInput
                  id="name"
                  type="text"
                  name="name"
                  value={data.name}
                  className="mt-1 block w-full"
                  onChange={(e) => setData('name', e.target.value)}
                  required
                />
                <InputError message={errors.name} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                  id="email"
                  type="email"
                  name="email"
                  value={data.email}
                  className="mt-1 block w-full"
                  onChange={(e) => setData('email', e.target.value)}
                  required
                />
                <InputError message={errors.email} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="role" value="Rôle" />
                <select
                  id="role"
                  name="role"
                  value={data.role}
                  onChange={(e) => setData('role', e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                  required
                >
                  {Object.entries(roles).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <InputError message={errors.role} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="password" value="Mot de passe" />
                <TextInput
                  id="password"
                  type="password"
                  name="password"
                  value={data.password}
                  className="mt-1 block w-full"
                  onChange={(e) => setData('password', e.target.value)}
                  required
                />
                <InputError message={errors.password} className="mt-2" />
              </div>

              <div>
                <InputLabel htmlFor="password_confirmation" value="Confirmer le mot de passe" />
                <TextInput
                  id="password_confirmation"
                  type="password"
                  name="password_confirmation"
                  value={data.password_confirmation}
                  className="mt-1 block w-full"
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  required
                />
                <InputError message={errors.password_confirmation} className="mt-2" />
              </div>

              <div className="flex items-center justify-end mt-4">
                <Link
                  href={route('users.index')}
                  className="mr-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}