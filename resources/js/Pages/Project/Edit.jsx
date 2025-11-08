import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, useForm, router} from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import TextAreaInput from '@/Components/TextAreaInput';
import SelectInput from '@/Components/SelectInput ';
import {Link} from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
  PencilSquareIcon, 
  PhotoIcon, 
  XMarkIcon, 
  PlusIcon, 
  UserIcon, 
  TagIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Edit({auth, project, users}) {
  const [productNames, setProductNames] = useState([]);
  const [newProductName, setNewProductName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {data, setData, put, processing, errors, reset, setError, clearErrors} = useForm({
    name: project.name || "",
    description: project.description || "",
    reference: project.reference || "",
    members: project.members || "",
    products: project.products ? project.products.map(p => p.name) : [],
    image: null,
  });

  useEffect(() => {
    if (project.products && project.products.length > 0) {
      const productNames = project.products.map(product => product.name);
      setProductNames(productNames);
      setData('products', productNames);
    }
    if (project.members) {
      const memberObjects = project.members.map(member => ({
        id: member.id,
        name: member.name
      }));
      setSelectedMembers(memberObjects);
      setData('members', memberObjects.map(member => member.id).join(','));
    }
  }, [project]);

  const addProductName = () => {
    if (newProductName.trim()) {
      const updatedProducts = [...productNames, newProductName.trim()];
      setProductNames(updatedProducts);
      setData('products', updatedProducts);
      setNewProductName('');
      clearErrors('products');
    }
  };

  const removeProductName = (index) => {
    const updatedProducts = productNames.filter((_, i) => i !== index);
    setProductNames(updatedProducts);
    setData('products', updatedProducts);
  };

  const addMember = () => {
    if (selectedMemberId) {
      const selectedUser = users.find(user => user.id === parseInt(selectedMemberId));
      if (selectedUser && !selectedMembers.some(member => member.id === selectedUser.id)) {
        const newMembers = [...selectedMembers, selectedUser];
        setSelectedMembers(newMembers);
        setData('members', newMembers.map(member => member.id).join(','));
        setSelectedMemberId('');
        clearErrors('members');
      }
    }
  };

  const removeMember = (memberId) => {
    const updatedMembers = selectedMembers.filter(member => member.id !== memberId);
    setSelectedMembers(updatedMembers);
    setData('members', updatedMembers.map(member => member.id).join(','));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    if (processing) return;

    // Clear any existing errors
    clearErrors();
    
    const formData = new FormData();
    
    // Basic info
    formData.append('_method', 'PUT'); // Required for PUT requests with FormData
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('reference', data.reference || '');
    
    // Members
    const memberIds = selectedMembers.map(member => member.id);
    formData.append('members', memberIds.join(','));
    
    // Products
    if (productNames.length > 0) {
      productNames.forEach((product, index) => {
        formData.append(`products[${index}]`, product);
      });
    } else {
      formData.append('products[]', ''); // Send empty array properly
    }
    
    // Image - Only append if it's a new file
    if (data.image instanceof File) {
      formData.append('image', data.image);
    }

    // Debug log
    console.log('Submitting form with data:', {
      name: data.name,
      description: data.description,
      reference: data.reference,
      members: memberIds,
      products: productNames,
      hasImage: data.image instanceof File
    });

    // Use post instead of put for proper FormData handling
    router.post(route('projects.update', project.id), formData, {
      forceFormData: true,
      preserveState: true,
      preserveScroll: true,
      onBefore: () => {
        setIsSubmitting(true);
        return true;
      },
      onSuccess: () => {
        setIsSubmitting(false);
        reset();
        router.visit(route('projects.index'), {
          only: ['projects'],
          preserveScroll: true,
          data: { success: 'La machine a été mise à jour avec succès.' }
        });
      },
      onError: (errors) => {
        setIsSubmitting(false);
        console.error('Form submission errors:', errors);
        
        Object.keys(errors).forEach(key => {
          setError(key, errors[key]);
        });
        
        // Scroll to the first error
        const firstError = document.querySelector('.text-red-600');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
    });
  };

  // Add input change handlers
  const handleInputChange = (field, value) => {
    clearErrors(field);
    setData(field, value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear any existing image errors
      clearErrors('image');
      
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!allowedTypes.includes(file.type)) {
        setError('image', 'Le fichier doit être une image (JPEG, PNG, JPG, ou GIF).');
        return;
      }
      
      if (file.size > maxSize) {
        setError('image', 'L\'image ne doit pas dépasser 2Mo.');
        return;
      }
      
        setData('image', file);
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
            <div>
              <p className="text-sm text-gray-400">Modification</p>
              <h2 className="text-2xl font-bold text-white">
                {project.name}
            </h2>
            </div>
          </div>
        </div>
      }
    >
      <Head title={`Modifier "${project.name}"`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
            <form onSubmit={onSubmit} className="space-y-12">
              {/* Step 1: Current Status */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  1
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">État Actuel de la Machine</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <CalendarIcon className="w-5 h-5" />
                        <span>Créé le</span>
                      </div>
                      <p className="text-white">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <UserIcon className="w-5 h-5" />
                        <span>Créé par</span>
                      </div>
                      <p className="text-white">{project.createdBy?.name || 'N/A'}</p>
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
                    <div>
                      <InputLabel htmlFor="name" value="Nom de la Machine" />
                <TextInput
                        id="name"
                  type="text"
                  value={data.name}
                        className="mt-1 block w-full"
                  onChange={e => handleInputChange('name', e.target.value)}
                />
                <InputError message={errors.name} className="mt-2" />
              </div>

                    <div>
                      <InputLabel htmlFor="reference" value="Référence" />
                      <TextInput
                        id="reference"
                        type="text"
                  value={data.reference}
                        className="mt-1 block w-full"
                  onChange={e => handleInputChange('reference', e.target.value)}
                />
                <InputError message={errors.reference} className="mt-2" />
              </div>

                    <div>
                      <InputLabel htmlFor="description" value="Description" />
                      <TextAreaInput
                        id="description"
                        value={data.description}
                        className="mt-1 block w-full"
                        onChange={e => handleInputChange('description', e.target.value)}
                        rows={4}
                      />
                      <InputError message={errors.description} className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Members */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  3
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Membres</h3>
                  <div className="space-y-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                <div className="flex gap-2">
                  <SelectInput
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="flex-1"
                  >
                    <option value="">Sélectionner un membre</option>
                    {users?.filter(user => !selectedMembers.some(member => member.id === user.id))
                      .map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </SelectInput>
                  <button
                    type="button"
                    onClick={addMember}
                        className="px-3 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors duration-200"
                  >
                        <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                    <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5"
                    >
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-white text-sm">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                            <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <InputError message={errors.members} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Step 4: Products */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  4
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Produits</h3>
                  <div className="space-y-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                <div className="flex gap-2">
                  <TextInput
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                        className="flex-1"
                        placeholder="Nom du produit"
                  />
                  <button
                    type="button"
                    onClick={addProductName}
                        className="px-3 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors duration-200"
                  >
                        <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                    <div className="flex flex-wrap gap-2">
                  {productNames.map((name, index) => (
                    <div
                      key={index}
                          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5"
                    >
                          <TagIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-white text-sm">{name}</span>
                      <button
                        type="button"
                        onClick={() => removeProductName(index)}
                            className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                            <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <InputError message={errors.products} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Step 5: Image */}
              <div className="relative">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white">
                  5
                </div>
                <div className="ml-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">Image de la Machine</h3>
                  <div className="space-y-4 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 p-6 rounded-xl border border-white/5">
                    {project.image_path && (
                      <div className="relative rounded-lg overflow-hidden mb-4">
                        <img
                          src={project.image_path}
                          alt={project.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <p className="absolute bottom-2 left-2 text-sm text-white/80">Image actuelle</p>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full"
                        accept="image/*"
                      />
                      <InputError message={errors.image} className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
                <Link
                  href={route('projects.index')}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Mise à jour en cours...</span>
                    </>
                  ) : (
                    <span>Enregistrer les modifications</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}