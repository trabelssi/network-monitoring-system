import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import TextAreaInput from '@/Components/TextAreaInput';
import { Link } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Create({ auth, task }) {
  const { data, setData, post, errors, reset, processing } = useForm({
    description: '',
    image: '',
    task_id: task?.id || '',
  });

  useEffect(() => {
    if (!task) {
      router.visit(route('interventions.index'));
    }
  }, [task]);

  const onSubmit = (e) => {
    e.preventDefault();
    post(route('interventions.store'), {
      onSuccess: () => {
        reset();
      },
    });
  };

  if (!task) {
    return null;
  }

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Ajouter une Intervention
            </h2>
          </div>
        </div>
      }
    >
      <Head title="Ajouter une Intervention" />

      <div className="py-12">
        <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-black/40 backdrop-blur-lg rounded-xl shadow-xl border border-white/10 transition-all duration-300 animate-fade-in">
            <form onSubmit={onSubmit} className="p-8 space-y-8">
              {/* Task Information Card */}
              <div className="bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Informations de la Ticket
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Nom de la Ticket</p>
                    <p className="text-white font-medium">{task.name}</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Machines</p>
                    <p className="text-white font-medium">
                      {task.projects && task.projects.length > 0 
                        ? task.projects.map(p => p.name).join(', ')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Créé par</p>
                    <p className="text-white font-medium">{task.created_by?.name || task.createdBy?.name || 'N/A'}</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Date de création</p>
                    <p className="text-white font-medium">{new Date(task.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Intervention Form */}
              <div className="bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Détails de l'Intervention
                </h3>

                <div className="space-y-6">
                  <div>
                    <InputLabel htmlFor="description" value="Description de l'Intervention" className="text-gray-300" />
                    <TextAreaInput
                      id="description"
                      name="description"
                      value={data.description}
                      className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                      onChange={(e) => setData('description', e.target.value)}
                      required
                    />
                    <InputError message={errors.description} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="image" value="Joindre une Image (optionnel)" className="text-gray-300" />
                    <div className="mt-1">
                      <TextInput
                        id="image"
                        type="file"
                        name="image"
                        className="block w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 file:transition-all file:duration-300"
                        onChange={(e) => setData('image', e.target.files[0])}
                        accept="image/*"
                      />
                    </div>
                    <InputError message={errors.image} className="mt-2" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Link
                  href={route('interventions.index')}
                  className="px-6 py-3 bg-black/40 backdrop-blur-sm border border-white/10 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-black/60 hover:border-white/20 hover:scale-105"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
                  disabled={processing}
                >
                  {processing ? 'Traitement...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
