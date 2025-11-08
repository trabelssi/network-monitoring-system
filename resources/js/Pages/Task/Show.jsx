import { TASK_STATUS_CLASS_MAP, TASK_STATUS_TEXT_MAP, INTERVENTION_STATUS_CLASS_MAP, INTERVENTION_STATUS_TEXT_MAP } from '@/constants.jsx';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage, router } from '@inertiajs/react';
import { TASK_PRIORITY_CLASS_MAP, TASK_PRIORITY_TEXT_MAP } from '@/constants.jsx';
import { useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  UserIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  FlagIcon,
  PencilSquareIcon,
  EyeIcon,
  PhotoIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

export default function Show({ auth, task }) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [imageError, setImageError] = useState(null);
  
  // Initialize interventions collapse state from localStorage
  const [collapsedInterventions, setCollapsedInterventions] = useState(() => {
    try {
      const saved = localStorage.getItem(`task_${task.id}_collapsed_interventions`);
      const initialState = saved ? JSON.parse(saved) : {};
      
      // Ensure all interventions have a state
      if (task.interventions) {
        task.interventions.forEach(intervention => {
          if (!(intervention.id in initialState)) {
            initialState[intervention.id] = true; // true means collapsed
          }
        });
      }
      return initialState;
    } catch (error) {
      console.error('Error loading intervention states:', error);
      // Fallback to default state
      const fallbackState = {};
      if (task.interventions) {
        task.interventions.forEach(intervention => {
          fallbackState[intervention.id] = true;
        });
      }
      return fallbackState;
    }
  });

  // Persist intervention collapse state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        `task_${task.id}_collapsed_interventions`,
        JSON.stringify(collapsedInterventions)
      );
    } catch (error) {
      console.error('Error saving intervention states:', error);
    }
  }, [collapsedInterventions, task.id]);

  const isAssignedUser = auth.user.id === task.assigned_user_id;
  const isTaskCreator = auth.user.id === task.created_by;

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
    setZoomLevel(1); // Reset zoom when closing
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleIntervention = (interventionId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsedInterventions(prev => ({
      ...prev,
      [interventionId]: !prev[interventionId]
    }));
  };

  // Section component for reusability
  const Section = ({ id, title, icon: Icon, children }) => {
    const isCollapsed = collapsedSections[id];
    
    return (
      <div className="relative mb-8">
        <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
          {id}
        </div>
        <div className="ml-8">
          <div 
            className="flex items-center justify-between mb-4 border-b border-white/10 pb-2 cursor-pointer group"
            onClick={() => toggleSection(id)}
          >
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Icon className="w-6 h-6 text-cyan-400" />
              {title}
            </h3>
            <button 
              className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 p-1 rounded-lg group-hover:bg-white/5"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(id);
              }}
            >
              {isCollapsed ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronUpIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className={`transform transition-all duration-300 origin-top ${isCollapsed ? 'scale-y-0 h-0 opacity-0' : 'scale-y-100 opacity-100'}`}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Update the intervention click handler
  const handleInterventionClick = (interventionId) => {
    router.visit(route('interventions.show', interventionId), {
          preserveScroll: true,
      preserveState: true
    });
  };

  // Enhanced image handling
  const handleImageClick = useCallback((e, imageUrl) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imageUrl) {
      setImageError('URL d\'image invalide');
      return;
    }

    try {
      // Handle both relative and absolute URLs
      const baseUrl = window.location.origin;
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.error('Invalid image URL:', error);
      setImageError('URL d\'image invalide');
    }
  }, []);

  // Image error handling
  const handleImageError = useCallback((e) => {
    e.target.src = '/images/fallback-image.jpg';
    setImageError('Erreur de chargement de l\'image');
  }, []);

  // Clear image error after 5 seconds
  useEffect(() => {
    if (imageError) {
      const timer = setTimeout(() => setImageError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [imageError]);

  // Enhanced image modal handling
  const handleImageModal = useCallback((imageUrl) => {
    if (!imageUrl) {
      setImageError('URL d\'image invalide');
      return;
    }

    try {
      // Handle both relative and absolute URLs
      const baseUrl = window.location.origin;
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      // Just set the modal to open, no need to construct URL object
      setIsImageModalOpen(true);
    } catch (error) {
      console.error('Invalid image URL:', error);
      setImageError('URL d\'image invalide');
    }
  }, []);

  // Add this near other image-related code
  const ImageWithFallback = ({ src, alt, className, onClick }) => {
    if (!src) return null;

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={onClick}
        onError={handleImageError}
        loading="lazy"
      />
    );
  };

  return (
    <>
      <Head title={`Ticket "${task.name}"`} />

      {/* Image Modal/Lightbox */}
      {isImageModalOpen && task.image_path && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={handleCloseModal}
        >
          {/* Image container */}
          <div className="relative w-full max-w-7xl mx-auto overflow-auto mb-16">
            <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-300"
                 style={{ 
                   transform: `scale(${zoomLevel})`,
                   transition: 'transform 0.3s ease-out'
                 }}>
              <ImageWithFallback
                src={task.image_path}
                alt="Preuve du problème"
                className="w-full h-auto max-h-[85vh] object-contain"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  transformOrigin: 'center center',
                }}
              />
            </div>
          </div>

          {/* Bottom controls bar */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/40 backdrop-blur-sm p-3 rounded-2xl border border-white/10 shadow-xl">
            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="text-white hover:text-cyan-400 transition-colors duration-300 p-2 hover:bg-white/10 rounded-lg"
                title="Zoom out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-white/80 min-w-[4rem] text-center font-medium">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="text-white hover:text-cyan-400 transition-colors duration-300 p-2 hover:bg-white/10 rounded-lg"
                title="Zoom in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-white/10"></div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseModal();
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white h-10 px-4 rounded-lg flex items-center gap-2 transform transition-all duration-300 hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/50 group relative"
            >
              <XMarkIcon className="w-5 h-5 transform transition-transform duration-300 group-hover:scale-110" />
              <span className="font-medium">Fermer</span>
              <div className="absolute inset-0 rounded-lg bg-red-400/20 animate-ping" />
            </button>
          </div>
        </div>
      )}

      {imageError && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {imageError}
        </div>
      )}

      <AuthenticatedLayout
        user={auth.user}
        header={
          <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
                <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                {task.name}
              </h2>
            </div>
            {auth.user.id === task.created_by && (
              <Link 
                href={route('task.edit', task.id)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <PencilSquareIcon className="w-5 h-5" />
                Modifier le Ticket
              </Link>
            )}
          </div>
        }
      >
        <div className="py-12 animate-fade-in">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            {/* Section 1: Image */}
            <Section id="1" title="Preuve du Problème" icon={PhotoIcon}>
            {task.image_path ? (
                <div className="relative group">
                  <div 
                    className="relative overflow-hidden rounded-2xl transform transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                    onClick={() => handleImageModal(task.image_path)}
                  >
                <ImageWithFallback
                  src={task.image_path}
                      alt="Preuve du problème"
                  className="w-full h-96 object-cover"
                />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-100 group-hover:opacity-90 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                        <span className="text-sm">Cliquez pour agrandir l'image</span>
                      </div>
                      <div className="absolute top-4 right-4 bg-black/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <ArrowsPointingOutIcon className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-white/90">Vue complète</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 bg-black/20 rounded-xl p-4 border border-white/10">
                    <p className="text-gray-400 text-sm">
                      Cette image montre la preuve visuelle du problème signalé. Cliquez sur l'image pour l'afficher en taille réelle et examiner les détails.
                    </p>
                  </div>
              </div>
            ) : (
                <div className="w-full h-96 bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <PhotoIcon className="w-12 h-12" />
                <span>Aucune image disponible</span>
                  </div>
                  <p className="text-sm max-w-md text-center text-gray-500">
                    Aucune preuve visuelle n'a été fournie pour ce problème. Les images peuvent aider à mieux comprendre et résoudre le problème.
                  </p>
              </div>
            )}
            </Section>

            {/* Section 2: Basic Information */}
            <Section id="2" title="Informations de Base" icon={ClipboardDocumentListIcon}>
              <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">ID du Ticket</label>
                      <p className="text-white group-hover:text-cyan-400 transition-colors duration-300">#{task.id}</p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Nom du Ticket</label>
                    <p className="text-white group-hover:text-cyan-400 transition-colors duration-300">{task.name}</p>
                  </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Description</label>
                      <p className="text-white leading-relaxed">{task.description}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Statut</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${TASK_STATUS_CLASS_MAP[task.status] || 'bg-gray-500'}`}>
                        {TASK_STATUS_TEXT_MAP[task.status] || task.status}
                      </span>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Priorité</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${TASK_PRIORITY_CLASS_MAP[task.priority] || 'bg-gray-500'}`}>
                        {TASK_PRIORITY_TEXT_MAP[task.priority] || task.priority || 'Non définie'}
                      </span>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Date limite</label>
                      <div className="flex items-center gap-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                        <CalendarIcon className="w-5 h-5" />
                        <span>{task.due_date || 'Non définie'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Section 3: Products and Project */}
            <Section id="3" title="Machine et Produits" icon={TagIcon}>
              <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Machine</label>
                    <div className="flex items-center gap-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                      <TagIcon className="w-5 h-5" />
                      <span>
                      {task.products && task.products.length > 0 && task.products[0].project
                        ? task.products[0].project.name
                        : 'Aucune machine'}
                      </span>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Produit(s)</label>
                    <div className="text-white">
                      {task.products && task.products.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {task.products.map((product) => (
                            <span key={product.id} className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg px-3 py-1 text-sm">
                              {product.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-2">
                          <TagIcon className="w-5 h-5" />
                          Aucun produit assigné
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                  </div>
            </Section>
                  
            {/* Section 4: Users */}
            <Section id="4" title="Utilisateurs" icon={UserGroupIcon}>
              <div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Créé Par</label>
                      <div className="flex items-center gap-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                        <UserIcon className="w-5 h-5" />
                        <span>{task.createdBy.name}</span>
                  </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Utilisateur Assigné</label>
                      <div className="flex items-center gap-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                        <UserIcon className="w-5 h-5" />
                        <span>{task.assignedUser ? task.assignedUser.name : 'Non assigné'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Observateurs</label>
                      <div className="flex items-center gap-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                        <UserGroupIcon className="w-5 h-5" />
                        <span>
                        {task.observers && task.observers.length > 0 
                          ? task.observers.map(observer => observer.name).join(', ') 
                          : 'Aucun observateur'}
                        </span>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Mis à Jour Par</label>
                      <div className="flex items-center gap-2 text-white group-hover:text-cyan-400 transition-colors duration-300">
                        <UserIcon className="w-5 h-5" />
                        <span>{task.updatedBy.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Section 5: Interventions */}
            <Section id="5" title="Interventions" icon={ClockIcon}>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-2 rounded-xl border border-cyan-500/20">
                      <ClockIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">Interventions</h3>
                      <p className="text-sm text-gray-400">
                        {task.interventions?.length || 0} intervention(s) au total
                      </p>
                    </div>
                  </div>
        {isAssignedUser && (
              <Link
                href={route('interventions.create', { task_id: task.id })}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg shadow-cyan-500/20 font-medium"
              >
                <span className="text-xl">+</span>
                      <span>Nouvelle Intervention</span>
              </Link>
                  )}
          </div>

                <div className="bg-gradient-to-b from-black/40 to-black/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
            {task.interventions && task.interventions.length > 0 ? (
              <div className="space-y-6">
                {task.interventions.map((intervention) => (
                  <div
                    key={intervention.id}
                          className="group relative bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-black/30 transition-all duration-300 cursor-pointer transform hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/5 hover:border-cyan-500/20"
                          onClick={() => handleInterventionClick(intervention.id)}
                  >
                          {/* Header */}
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3 rounded-xl border border-cyan-500/20">
                                <ClockIcon className="w-6 h-6 text-cyan-400" />
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors duration-300">
                        Intervention #{intervention.id}
                      </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <CalendarIcon className="w-4 h-4" />
                        {intervention.action_time
                          ? new Date(intervention.action_time).toLocaleString()
                          : 'Date inconnue'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium shadow-inner ring-1 ring-white/10 ${INTERVENTION_STATUS_CLASS_MAP[intervention.status] || 'bg-gray-500'}`}>
                                {INTERVENTION_STATUS_TEXT_MAP[intervention.status] || intervention.status}
                      </span>
                              <button
                                onClick={(e) => toggleIntervention(intervention.id, e)}
                                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 p-1 rounded-lg hover:bg-white/5"
                                title={collapsedInterventions[intervention.id] ? "Développer" : "Réduire"}
                              >
                                {collapsedInterventions[intervention.id] ? (
                                  <ChevronDownIcon className="w-5 h-5 transform transition-transform duration-200" />
                                ) : (
                                  <ChevronUpIcon className="w-5 h-5 transform transition-transform duration-200" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Content */}
                          <div 
                            className={`transform transition-all duration-300 origin-top overflow-hidden ${
                                collapsedInterventions[intervention.id] 
                                    ? 'scale-y-0 h-0 opacity-0' 
                                    : 'scale-y-100 opacity-100'
                            }`}
                          >
                            {/* Description */}
                            <div className="mt-4 bg-gradient-to-r from-black/40 to-black/20 rounded-xl p-4 border border-white/5">
                              <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                                {intervention.description}
                              </p>
                    </div>

                            {/* User Info */}
                            <div className="flex items-center gap-3 mt-4">
                              <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 px-4 py-2 rounded-full border border-cyan-500/10">
                                <UserIcon className="w-4 h-4 text-cyan-400" />
                                {intervention.user ? (
                                  <span className={`${intervention.user.is_active ? 'text-cyan-400' : 'text-red-400 line-through'} text-sm font-medium`}>
                                    {intervention.user.name}
                      </span>
                                ) : (
                                  <span className="text-gray-400 text-sm">Utilisateur supprimé</span>
                                )}
                              </div>
                    </div>

                            {/* Image */}
                            {intervention.image_path && (
                              <div className="mt-6">
                                <div className="relative group/image">
                                  <a
                                    href={intervention.image_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => handleImageClick(e, intervention.image_path)}
                                    className="block relative aspect-video rounded-xl overflow-hidden border border-white/10 group-hover/image:border-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50"
                                  >
                                    <ImageWithFallback
                                      src={intervention.image_path}
                                      alt={`Intervention #${intervention.id}`}
                                      className="w-full h-full object-cover transform transition-transform duration-300 group-hover/image:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                                      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90">
                                        <MagnifyingGlassIcon className="w-5 h-5" />
                                        <span className="text-sm font-medium">Voir l'image</span>
                                      </div>
                                    </div>
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Rejection Info */}
                            {intervention.status === 'rejected' && (
                              <div className="mt-6 bg-gradient-to-r from-red-500/10 to-red-900/10 rounded-xl p-6 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-red-500/10 p-2 rounded-lg">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                                  </div>
                                  <span className="text-red-400 font-medium">Raison du rejet</span>
                                </div>
                                <p className="text-red-300 leading-relaxed">{intervention.rejection_comment}</p>
                                {intervention.rejection_image_path && (
                                  <div className="mt-4">
                                    <a
                                      href={intervention.rejection_image_path}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => handleImageClick(e, intervention.rejection_image_path)}
                                      className="block relative aspect-video rounded-xl overflow-hidden border border-red-500/20 hover:border-red-500/40 transition-all duration-300 shadow-lg shadow-red-500/5"
                                    >
                                      <ImageWithFallback
                                        src={intervention.rejection_image_path}
                                        alt={`Rejet de l'intervention #${intervention.id}`}
                                        className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90">
                                          <MagnifyingGlassIcon className="w-5 h-5" />
                                          <span className="text-sm font-medium">Voir l'image de rejet</span>
                                        </div>
                                      </div>
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Approval Info */}
                            {intervention.status === 'approved' && intervention.rating_comment && (
                              <div className="mt-6 bg-gradient-to-r from-emerald-500/10 to-emerald-900/10 rounded-xl p-6 border border-emerald-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-emerald-500/10 p-2 rounded-lg">
                                    <CheckIcon className="w-5 h-5 text-emerald-400" />
                                  </div>
                                  <span className="text-emerald-400 font-medium">Commentaire</span>
                                </div>
                                <p className="text-emerald-300 leading-relaxed">{intervention.rating_comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                        </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 rounded-full border border-cyan-500/20">
                          <ClockIcon className="w-12 h-12 text-cyan-400" />
                        </div>
                      </div>
                      <h3 className="text-xl font-medium text-white mb-2">
                        Aucune intervention
                      </h3>
                      <p className="text-gray-400 max-w-md mx-auto">
                        {isAssignedUser
                          ? "Ajoutez une intervention pour cette tâche en cliquant sur le bouton 'Nouvelle Intervention'."
                          : "Aucune intervention n'a encore été ajoutée pour cette tâche."}
                      </p>
                      </div>
                    )}
                  </div>
              </div>
            </Section>
          </div>
        </div>
      </AuthenticatedLayout>
    </>
  );
}
