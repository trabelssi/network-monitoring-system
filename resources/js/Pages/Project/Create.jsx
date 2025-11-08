import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {Head, useForm, router} from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import TextAreaInput from '@/Components/TextAreaInput';
import SelectInput from '@/Components/SelectInput ';
import {Link} from '@inertiajs/react';
import { useState } from 'react';

export default function Create({auth, users}) {
  const [productNames, setProductNames] = useState([]);
  const [newProductName, setNewProductName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const {data, setData, post, processing, errors, reset} = useForm({
    image: '',
    name: '',
    description: '',
    reference: '',
    members: '',
    products: [],
  });

  const addProductName = () => {
    if (newProductName.trim()) {
      const updatedProducts = [...productNames, newProductName.trim()];
      setProductNames(updatedProducts);
      setData('products', updatedProducts);
      setNewProductName('');
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
        setSelectedMembers([...selectedMembers, selectedUser]);
        setData('members', [...selectedMembers, selectedUser].map(member => member.id).join(', '));
        setSelectedMemberId('');
      }
    }
  };

  const removeMember = (memberId) => {
    const updatedMembers = selectedMembers.filter(member => member.id !== memberId);
    setSelectedMembers(updatedMembers);
    setData('members', updatedMembers.map(member => member.id).join(', '));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('reference', data.reference);
    formData.append('members', data.members);
    data.products.forEach((product, index) => {
      formData.append(`products[${index}]`, product);
    });
    
    if (data.image) {
      formData.append('image', data.image);
    }

    post(route('projects.store'), formData, {
      forceFormData: true,
      preserveScroll: true,
      onBefore: () => !processing,
      onSuccess: () => {
        reset();
        router.visit(route('projects.index'), {
          preserveScroll: true,
          preserveState: true
        });
      },
      onError: (errors) => {
        console.error('Form submission errors:', errors);
        // Scroll to the first error
        const firstError = document.querySelector('.text-red-600');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
    });
  };

  return (
    <AuthenticatedLayout
      user = {auth.user}
      header={
        <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Créer une Nouvelle Machine
            </h2>
          </div>
        </div>
      }
    >
      <Head title="Machines" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8 transform transition-all duration-300 hover:scale-[1.01]">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="group">
                <InputLabel htmlFor="project_image_path" value="Image de la Machine" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextInput
                  id="project_image_path"
                  type="file"
                  name="image"
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  onChange={e => setData('image', e.target.files[0])}
                />
                <InputError message={errors.image} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="project_name" value="Nom de la Machine" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextInput
                  id="project_name"
                  type="text"
                  name="name"
                  value={data.name}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  isFocused={true}
                  onChange={e => setData('name', e.target.value)}
                />
                <InputError message={errors.name} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="project_description" value="Description de la Machine" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextAreaInput
                  id="project_description"
                  name="description"
                  value={data.description}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  onChange={e => setData('description', e.target.value)}
                />
                <InputError message={errors.description} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="project_reference" value="Référence" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <TextAreaInput
                  id="project_reference"
                  name="reference"
                  value={data.reference}
                  className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                  onChange={e => setData('reference', e.target.value)}
                />
                <InputError message={errors.reference} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="project_members" value="Membres" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <div className="flex gap-2">
                  <SelectInput
                    id="project_members"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
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
                    className="mt-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1"
                    >
                      <span className="text-white">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <InputError message={errors.members} className="mt-2" />
              </div>

              <div className="group">
                <InputLabel htmlFor="project_products" value="Produits" className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2" />
                <div className="flex gap-2">
                  <TextInput
                    id="project_products"
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="mt-1 block w-full bg-black/40 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:border-cyan-400"
                    placeholder="Entrez un nom de Produit"
                  />
                  <button
                    type="button"
                    onClick={addProductName}
                    className="mt-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {productNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1"
                    >
                      <span className="text-white">{name}</span>
                      <button
                        type="button"
                        onClick={() => removeProductName(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <InputError message={errors.products} className="mt-2" />
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Link
                  href={route('projects.index')}
                  className="bg-black/40 backdrop-blur-lg border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-black/60 transition-all duration-300 hover:scale-105"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className={`bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 ${processing ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création en cours...
                    </span>
                  ) : (
                    'Créer la Machine'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}