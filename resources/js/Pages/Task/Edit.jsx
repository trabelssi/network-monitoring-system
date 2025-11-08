import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import TextAreaInput from '@/Components/TextAreaInput';
import SelectInput from '@/Components/SelectInput';
import { Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { TASK_PRIORITY_TEXT_MAP, TASK_STATUS_TEXT_MAP } from '@/constants.jsx';
import { 
  PencilSquareIcon, 
  UserIcon,
  CalendarIcon,
  ListBulletIcon,
  FlagIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function Edit({ auth, task, products, users, projects }) {
  // Initialize machine ID from the first product's project
  const [selectedMachineId, setSelectedMachineId] = useState(() => {
    if (task.products && task.products.length > 0 && task.products[0].project) {
      return String(task.products[0].project.id);
    }
    return '';
  });
  
  // Initialize selected products from task
  const [selectedProductIds, setSelectedProductIds] = useState(() => {
    if (task.products && task.products.length > 0) {
      return task.products.map(p => p.id);
    }
    return [];
  });
  
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Initialize observers from task
  const [selectedObservers, setSelectedObservers] = useState(() => {
    if (task.observers && task.observers.length > 0) {
      return task.observers;
    }
    return [];
  });
  
  const [selectedObserverId, setSelectedObserverId] = useState('');
  const [observersManuallyModified, setObserversManuallyModified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const isFirstRender = useRef(true);

  const { data, setData, post, errors, reset, clearErrors } = useForm({
    image: '',
    name: task.name || "",
    description: task.description || "",
    product_ids: task.products ? task.products.map(p => p.id) : [],
    assigned_user_id: task.assigned_user_id || "",
    observers: task.observers ? task.observers.map(o => o.id) : [],
    priority: task.priority || "",
    status: task.status || "",
    due_date: task.due_date || "",
    _method: 'PUT',
  });

  // Ensure users is always an array and extract data property
  const usersArray = Array.isArray(users) ? users.map(user => user.data || user) : Object.values(users ?? {}).map(user => user.data || user);

  // Ensure products is always an array and extract data property
  const productsArray = Array.isArray(products) 
    ? products.map(product => product.data || product) 
    : Object.values(products ?? {}).map(product => product.data || product);

  // Filter products by selected machine
  const filteredProducts = selectedMachineId
    ? productsArray.filter(product => product.project_id === parseInt(selectedMachineId))
    : [];

  // When machine changes, only reset products if it's not the initial load and if changing to a different machine
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Only clear products if changing to a different machine
    if (task.products && 
        task.products.length > 0 && 
        task.products[0].project && 
        selectedMachineId !== String(task.products[0].project.id)) {
    setSelectedProductIds([]);
    setData('product_ids', []);
      setFormTouched(true);
    }
  }, [selectedMachineId]);

  // Ensure observers are properly initialized and maintained
  useEffect(() => {
    if (task.observers && !observersManuallyModified) {
      setSelectedObservers(task.observers);
      setData('observers', task.observers.map(observer => observer.id));
    }
  }, [task.observers]);

  const addObserver = () => {
    if (selectedObserverId) {
      const selectedUser = usersArray.find(user => user.id === parseInt(selectedObserverId));
      if (selectedUser && !selectedObservers.some(observer => observer.id === selectedUser.id)) {
        const newObservers = [...selectedObservers, selectedUser];
        setSelectedObservers(newObservers);
        setData('observers', newObservers.map(observer => observer.id));
        setSelectedObserverId('');
        setObserversManuallyModified(true);
        setFormTouched(true);
      }
    }
  };

  const removeObserver = (observerId) => {
    const updatedObservers = selectedObservers.filter(observer => observer.id !== observerId);
    setSelectedObservers(updatedObservers);
    setData('observers', updatedObservers.map(observer => observer.id));
    setObserversManuallyModified(true);
    setFormTouched(true);
  };

  const addProduct = (productId) => {
    if (productId && !selectedProductIds.includes(parseInt(productId))) {
      const newProductIds = [...selectedProductIds, parseInt(productId)];
      setSelectedProductIds(newProductIds);
      setData('product_ids', newProductIds);
      setFormTouched(true);
    }
  };

  const removeProduct = (productId) => {
    const updatedProductIds = selectedProductIds.filter(id => id !== productId);
    setSelectedProductIds(updatedProductIds);
    setData('product_ids', updatedProductIds);
    setFormTouched(true);
  };

  const handleInputChange = (field, value) => {
    setData(field, value);
    setFormTouched(true);
    clearErrors(field);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    post(route('task.update', task.id), {
      data: data,
      onSuccess: () => {
        setIsSubmitting(false);
        setFormTouched(false);
        reset();
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Group products by project for better organization
  const productsByProject = (Array.isArray(productsArray) ? productsArray : []).reduce((acc, product) => {
    const projectName = product.project?.name || 'Unknown Project';
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(product);
    return acc;
  }, {});

  const handleMachineChange = (machineId) => {
    setSelectedMachineId(machineId);
    setSelectedProductId(''); // Reset product selection dropdown
    
    // If changing back to the original machine, restore original products
    if (task.products && 
        task.products.length > 0 && 
        task.products[0].project && 
        machineId === String(task.products[0].project.id)) {
      const originalProductIds = task.products.map(p => p.id);
      setSelectedProductIds(originalProductIds);
      setData('product_ids', originalProductIds);
    }
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
              <PencilSquareIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Modifier le Ticket {task.name}
            </h2>
          </div>
        </div>
      }
    >
      <Head title={`Modifier le Ticket ${task.name}`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8 transform transition-all duration-300">
            <form onSubmit={onSubmit} className="space-y-12">
              {/* Step 1: Current Status */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  1
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">État Actuel du Ticket</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <CalendarIcon className="w-5 h-5" />
                        <span>Créé le</span>
              </div>
                      <p className="text-white">{new Date(task.created_at).toLocaleDateString()}</p>
                </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <UserIcon className="w-5 h-5" />
                        <span>Créé par</span>
                      </div>
                      <p className="text-white">{task.createdBy?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Basic Information */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  2
              </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Informations de Base</h3>
                  <div className="space-y-6 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
              <div className="group">
                <InputLabel htmlFor="task_name" value="Nom du Ticket" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextInput
                  id="task_name"
                  type="text"
                  name="name"
                  value={data.name}
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                        onChange={(e) => handleInputChange('name', e.target.value)}
                />
                <InputError message={errors.name} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="task_description" value="Description du Ticket" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextAreaInput
                  id="task_description"
                  name="description"
                  value={data.description}
                        rows={4}
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                        onChange={(e) => handleInputChange('description', e.target.value)}
                />
                <InputError message={errors.description} className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Assignment and Priority */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  3
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Attribution et Priorité</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
              <div className="group">
                <InputLabel htmlFor="assigned_user_id" value="Utilisateur Assigné" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <SelectInput
                  id="assigned_user_id"
                  name="assigned_user_id"
                  value={data.assigned_user_id}
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                        onChange={(e) => handleInputChange('assigned_user_id', e.target.value)}
                >
                        <option value="">Sélectionner un utilisateur</option>
                  {usersArray.map((user) => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </SelectInput>
                <InputError message={errors.assigned_user_id} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="task_priority" value="Priorité du Ticket" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <SelectInput
                  id="task_priority"
                  name="priority"
                  value={data.priority}
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                        <option value="">Sélectionner la Priorité</option>
                  {Object.entries(TASK_PRIORITY_TEXT_MAP).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                  ))}
                </SelectInput>
                <InputError message={errors.priority} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="task_due_date" value="Date limite" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextInput
                  id="task_due_date"
                  type="date"
                  name="due_date"
                  value={data.due_date}
                        className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                />
                <InputError message={errors.due_date} className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Products */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  4
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Produits Associés</h3>
                  <div className="space-y-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <SelectInput
                          value={selectedMachineId}
                          onChange={(e) => handleMachineChange(e.target.value)}
                          className="bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                        >
                          <option value="">Sélectionner une machine</option>
                          {projects && projects.map(machine => (
                            <option 
                              key={machine.id} 
                              value={machine.id}
                            >
                              {machine.name}
                            </option>
                          ))}
                        </SelectInput>
                        <SelectInput
                          value={selectedProductId}
                          onChange={(e) => {
                            setSelectedProductId(e.target.value);
                            if (e.target.value) {
                              addProduct(e.target.value);
                            }
                          }}
                          className="bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                          disabled={!selectedMachineId}
                        >
                          <option value="">Ajouter un produit</option>
                          {filteredProducts.map(product => (
                            <option 
                              key={product.id} 
                              value={product.id}
                              disabled={selectedProductIds.includes(product.id)}
                            >
                              {product.name}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedProductIds.length === 0 ? (
                        <div className="text-gray-400 italic">Aucun produit sélectionné</div>
                      ) : (
                        selectedProductIds.map(productId => {
                          const product = productsArray.find(p => p.id === productId);
                          if (!product) return null;
                          return (
                            <div
                              key={product.id}
                              className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5 group hover:border-cyan-500/40 transition-all duration-200"
                            >
                              <span className="text-cyan-400">{product.name}</span>
                              <button
                                type="button"
                                onClick={() => removeProduct(product.id)}
                                className="text-red-400 hover:text-red-300 transition-colors duration-200"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <InputError message={errors.product_ids} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Step 5: Observers */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  5
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Observateurs</h3>
                  <div className="space-y-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                  <SelectInput
                    value={selectedObserverId}
                          onChange={e => setSelectedObserverId(e.target.value)}
                          className="bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                          <option value="">Sélectionner un observateur</option>
                          {usersArray.map(user => (
                            <option
                              key={user.id}
                              value={user.id}
                              disabled={selectedObservers.some(o => o.id === user.id)}
                            >
                              {user.name}
                            </option>
                    ))}
                  </SelectInput>
                  <button
                    type="button"
                    onClick={addObserver}
                          disabled={!selectedObserverId}
                          className="bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                          Ajouter
                  </button>
                </div>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-black/20 rounded-lg border border-white/5">
                      {selectedObservers.length === 0 ? (
                        <div className="text-gray-400 italic">Aucun observateur sélectionné</div>
                      ) : (
                        selectedObservers.map(observer => (
                    <div
                      key={observer.id}
                            className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5 group hover:border-cyan-500/40"
                    >
                            <span className="text-cyan-400">{observer.name}</span>
                      <button
                        type="button"
                        onClick={() => removeObserver(observer.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                              <XMarkIcon className="w-4 h-4" />
                      </button>
                          </div>
                        ))
                      )}
                    </div>
                    <InputError message={errors.observers} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Step 6: Image Upload */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  6
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Image du Ticket</h3>
                  <div className="space-y-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                    {task.image_path && (
                      <div className="mb-4 relative overflow-hidden rounded-lg">
                        <img
                          src={task.image_path}
                          alt="Current Task Image"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <p className="absolute bottom-2 left-2 text-sm text-white/80">Image actuelle</p>
                      </div>
                    )}
                    <TextInput
                      id="task_image"
                      type="file"
                      name="image"
                      className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                      onChange={(e) => handleInputChange('image', e.target.files[0])}
                    />
                    <InputError message={errors.image} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  {formTouched && (
                    <div className="text-yellow-400 flex items-center gap-1">
                      <ExclamationCircleIcon className="w-5 h-5" />
                      <span className="text-sm">Modifications non enregistrées</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                <Link
                  href={route('tasks.index')}
                    className="bg-black/40 backdrop-blur-lg border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-black/60 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                    <XMarkIcon className="w-5 h-5" />
                  Annuler
                </Link>
                <button
                  type="submit"
                    disabled={isSubmitting || !formTouched}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      isSubmitting || !formTouched
                        ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white hover:shadow-cyan-500/20'
                    }`}
                >
                    <CheckIcon className="w-5 h-5" />
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
