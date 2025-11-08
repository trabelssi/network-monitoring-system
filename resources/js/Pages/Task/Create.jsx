import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head , useForm} from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import TextAreaInput from '@/Components/TextAreaInput';
import SelectInput from '@/Components/SelectInput ';
import {Link} from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { TASK_PRIORITY_TEXT_MAP } from '@/constants.jsx';

export default function Create({auth, products, users, projects}) {
  const [formState, setFormState] = useState({
    projectId: '',
    productIds: [],
    observers: [],
    observersModified: false,
    isObserversDropdownOpen: false
  });

  const {data, setData, post, errors, reset} = useForm({
    image: '',
    name: '',
    description: '',
    product_ids: [],
    assigned_user_id: '',
    observers: [],
    priority: '',
    due_date: '',
  });

  // Memoize derived data
  const usersArray = useMemo(() => {
    return Array.isArray(users) 
      ? users.map(user => user.data || user) 
      : Object.values(users ?? {}).map(user => user.data || user);
  }, [users]);

  const productsArray = useMemo(() => {
    return Array.isArray(products) 
      ? products.map(product => product.data || product) 
      : Object.values(products ?? {}).map(product => product.data || product);
  }, [products]);
  
  // Memoize filtered products
  const filteredProducts = useMemo(() => {
    return formState.projectId
      ? productsArray.filter(product => product.project_id === parseInt(formState.projectId))
    : [];
  }, [formState.projectId, productsArray]);

  // Initialize from URL params only once
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');
    const members = urlParams.get('members');

    if (projectId && !formState.projectId) {
      const projectProducts = productsArray.filter(
        product => product.project_id === parseInt(projectId)
      );
      
      setFormState(prev => ({
        ...prev,
        projectId,
        productIds: projectProducts.map(p => p.id)
      }));
      
      setData('product_ids', projectProducts.map(p => p.id));
      }

    if (members && !formState.observersModified) {
      const memberIds = members.split(',').map(id => parseInt(id));
      const memberUsers = usersArray.filter(user => memberIds.includes(user.id));
      
      setFormState(prev => ({
        ...prev,
        observers: memberUsers
      }));
      
      setData('observers', memberIds);
    }
  }, []);

  // Memoize handlers
  const handleProjectChange = useCallback((e) => {
    const newProjectId = e.target.value;
    setFormState(prev => ({
      ...prev,
      projectId: newProjectId,
      productIds: []
    }));
    setData('product_ids', []);
  }, []);

  const handleProductToggle = useCallback((productId) => {
    setFormState(prev => {
      const newProductIds = prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId];
      
      setData('product_ids', newProductIds);
      
      return {
        ...prev,
        productIds: newProductIds
      };
    });
  }, []);

  const handleObserverToggle = useCallback((userId) => {
    setFormState(prev => {
        const isCurrentlySelected = prev.observers.some(o => o.id === userId);
        const selectedUser = usersArray.find(user => user.id === userId);
        
        let newObservers;
        if (isCurrentlySelected) {
            newObservers = prev.observers.filter(o => o.id !== userId);
        } else if (selectedUser) {
            newObservers = [...prev.observers, selectedUser];
        }

        setData('observers', newObservers.map(o => o.id));
        
        return {
            ...prev,
            observers: newObservers,
            observersModified: true
        };
    });
}, [usersArray]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    post(route('task.store'), {
      onSuccess: () => reset(),
      onError: () => console.error(errors),
    });
  }, [post, reset, errors]);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Créer un Nouveau Ticket
            </h2>
          </div>
        </div>
      }
    >
      <Head title="Tickets" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8 transform transition-all duration-300 hover:scale-[1.01]">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Project selection */}
              <div className="group">
                <InputLabel htmlFor="project_id" value="Machines" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <SelectInput
                  id="project_id"
                  name="project_id"
                  value={formState.projectId}
                  onChange={handleProjectChange}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg"
                >
                  <option value="">Sélectionner un Machine</option>
                  {projects && projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </SelectInput>
              </div>

              {/* Product selection */}
              <div className="group">
                <InputLabel htmlFor="product_ids" value="Produits" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map(product => {
                    const isSelected = formState.productIds.includes(product.id);
                    return (
                  <button
                        key={product.id}
                    type="button"
                    onClick={() => {
                          if (isSelected) {
                            handleProductToggle(product.id);
                          } else {
                            handleProductToggle(product.id);
                      }
                    }}
                        className={`
                          relative overflow-hidden group flex items-center justify-between p-4 rounded-lg border transition-all duration-300 transform hover:scale-[1.02]
                          ${isSelected 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-white' 
                            : 'bg-black/40 border-white/10 text-gray-300 hover:border-cyan-400/30'
                          }
                        `}
                      >
                        <span className="font-medium">{product.name}</span>
                        <div className={`
                          flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300
                          ${isSelected 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                            : 'bg-gray-700'
                          }
                        `}>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-4 w-4 transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-50'}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d={isSelected ? "M5 13l4 4L19 7" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} 
                            />
                    </svg>
                        </div>
                        {/* Animated background effect */}
                        <div className={`
                          absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20
                          transition-transform duration-1000 ease-in-out
                          ${isSelected ? 'opacity-100' : 'opacity-0'}
                          animate-gradient-x
                        `} />
                  </button>
                    );
                  })}
                </div>
                {formState.productIds.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-2">Produits sélectionnés:</div>
                    <div className="flex flex-wrap gap-2">
                  {formState.productIds.map(productId => {
                        const product = productsArray.find(p => p.id === productId);
                    if (!product) return null;
                    return (
                      <div
                        key={product.id}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-lg px-3 py-1"
                      >
                        <span className="text-white">{product.name}</span>
                      </div>
                    );
                  })}
                </div>
                  </div>
                )}
              </div>

              {/* Task Details */}
              <div className="group">
                <InputLabel htmlFor="task_image_path" value="Image du défaut" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextInput
                  id="task_image_path"
                  type="file"
                  name="image"
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  onChange={(e) => setData('image', e.target.files[0])}
                />
                <InputError message={errors.image} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="task_name" value="Nom du Ticket" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextInput
                  id="task_name"
                  type="text"
                  name="name"
                  value={data.name}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  isFocused={true}
                  onChange={(e) => setData('name', e.target.value)}
                />
                <InputError message={errors.name} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="task_description" value="Description" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextAreaInput
                  id="task_description"
                  name="description"
                  value={data.description}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  onChange={(e) => setData('description', e.target.value)}
                />
                <InputError message={errors.description} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="assigned_user_id" value="Assigné à" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <SelectInput
                  id="assigned_user_id"
                  name="assigned_user_id"
                  value={data.assigned_user_id}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg"
                  onChange={(e) => setData('assigned_user_id', e.target.value)}
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {usersArray.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </SelectInput>
                <InputError message={errors.assigned_user_id} className="mt-2" />
              </div>

              {/* Observers Section */}
              <div className="group relative">
                  <InputLabel htmlFor="observers" value="Observateurs" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                  
                  {/* Dropdown trigger button */}
                  <button
                      type="button"
                      onClick={() => setFormState(prev => ({ ...prev, isObserversDropdownOpen: !prev.isObserversDropdownOpen }))}
                      className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-4 py-2 flex items-center justify-between hover:border-cyan-400/30 transition-all duration-300"
                  >
                      <span className="text-gray-300">
                          {formState.observers.length 
                              ? `${formState.observers.length} observateur${formState.observers.length > 1 ? 's' : ''} sélectionné${formState.observers.length > 1 ? 's' : ''}`
                              : 'Sélectionner des observateurs'
                          }
                      </span>
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 transition-transform duration-300 ${formState.isObserversDropdownOpen ? 'transform rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                      >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                  </button>

                  {/* Dropdown menu */}
                  {formState.isObserversDropdownOpen && (
                      <div className="absolute z-50 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden">
                          <div className="max-h-60 overflow-y-auto">
                              {usersArray.map(user => {
                                  const isSelected = formState.observers.some(o => o.id === user.id);
                                  return (
                                      <button
                                          key={user.id}
                                          type="button"
                                          onClick={() => handleObserverToggle(user.id)}
                                          className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
                                      >
                                          <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                              {user.name}
                                          </span>
                                          <div className={`
                                              flex items-center justify-center w-5 h-5 rounded border transition-all duration-200
                                              ${isSelected 
                                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent' 
                                                  : 'border-gray-500'
                                              }
                                          `}>
                                              {isSelected && (
                                                  <svg 
                                                      xmlns="http://www.w3.org/2000/svg" 
                                                      className="h-3 w-3 text-white" 
                                                      fill="none" 
                                                      viewBox="0 0 24 24" 
                                                      stroke="currentColor"
                                                  >
                                                      <path 
                                                          strokeLinecap="round" 
                                                          strokeLinejoin="round" 
                                                          strokeWidth={2} 
                                                          d="M5 13l4 4L19 7" 
                                                      />
                                                  </svg>
                                              )}
                                          </div>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  {/* Selected observers list */}
                  {formState.observers.length > 0 && (
                      <div className="mt-4">
                          <div className="text-sm text-gray-400 mb-2">Observateurs sélectionnés:</div>
                          <div className="flex flex-wrap gap-2">
                              {formState.observers.map(observer => (
                                  <div
                                      key={observer.id}
                                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-lg px-3 py-1"
                                  >
                                      <span className="text-white">{observer.name}</span>
                                      <button
                                          type="button"
                                          onClick={() => handleObserverToggle(observer.id)}
                                          className="text-red-400 hover:text-red-300"
                                      >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
                  
                  <InputError message={errors.observers} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="priority" value="Priorité" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <SelectInput
                  id="priority"
                  name="priority"
                  value={data.priority}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg"
                  onChange={(e) => setData('priority', e.target.value)}
                >
                  <option value="">Sélectionner une priorité</option>
                  {Object.entries(TASK_PRIORITY_TEXT_MAP).map(([value, text]) => (
                    <option key={value} value={value}>{text}</option>
                  ))}
                </SelectInput>
                <InputError message={errors.priority} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="due_date" value="Date limite" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextInput
                  id="due_date"
                  type="date"
                  name="due_date"
                  value={data.due_date}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  onChange={(e) => setData('due_date', e.target.value)}
                />
                <InputError message={errors.due_date} className="mt-2" />
              </div>

              <div className="flex items-center justify-end mt-6">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300"
                >
                  Créer le ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}