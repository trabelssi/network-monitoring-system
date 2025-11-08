import { INTERVENTION_STATUS_CLASS_MAP, INTERVENTION_STATUS_TEXT_MAP } from '@/constants.jsx';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    ChevronLeftIcon, 
    ClockIcon,
    ClipboardDocumentListIcon,
    UserIcon,
    CalendarIcon,
    DocumentTextIcon,
    PhotoIcon,
    ExclamationTriangleIcon,
    CheckIcon,
    XMarkIcon,
    BuildingOfficeIcon,
    TagIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Show({ auth, intervention }) {
    if (!intervention) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <p className="text-white">Aucune donnée d'intervention disponible.</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (!intervention.task) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                            <p className="text-white">Chargement des détails de la Ticket...</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const isTaskCreator = auth.user.id === intervention.task.createdBy?.id;
    
    const { data, setData, post, processing, errors, reset } = useForm({
        status: '',
        rejection_comment: '',
        rejection_image: null,
        rating_comment: '',
        _method: 'PUT'
    });

    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [showApprovalForm, setShowApprovalForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApprove = () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        router.post(route('interventions.update', intervention.id), {
            _method: 'PUT',
            status: 'approved',
            rating_comment: data.rating_comment
        }, {
            onError: (errors) => {
                console.error('Approval error:', errors);
                const errorMessage = errors.error || 'Une erreur est survenue lors de l\'approbation. Veuillez réessayer.';
                alert(errorMessage);
            },
            onFinish: () => {
                setIsSubmitting(false);
                setShowApprovalForm(false);
            },
            preserveScroll: true
        });
    };

    const handleReject = () => {
        if (isSubmitting) return;

        if (!data.rejection_comment) {
            alert('Veuillez fournir une raison pour le rejet');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('status', 'rejected');
        formData.append('rejection_comment', data.rejection_comment);
        
        if (data.rejection_image) {
            formData.append('rejection_image', data.rejection_image);
        }

        router.post(route('interventions.update', intervention.id), formData, {
            onError: (errors) => {
                console.error('Rejection error:', errors);
                const errorMessage = errors.error || 'Une erreur est survenue lors du rejet. Veuillez réessayer.';
                alert(errorMessage);
            },
            onFinish: () => {
                setIsSubmitting(false);
                setShowRejectionForm(false);
            },
            preserveScroll: true
        });
    };

    return (
        <>
            <Head title="Détails de l'Intervention" />

            <AuthenticatedLayout
                user={auth.user}
                header={
                    <div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                                <ClockIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                                    Intervention #{intervention.id}
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-inner ring-1 ring-white/10 ${INTERVENTION_STATUS_CLASS_MAP[intervention.status] || 'bg-gray-500'}`}>
                                        {INTERVENTION_STATUS_TEXT_MAP[intervention.status] || intervention.status}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        {intervention.action_time
                                            ? new Date(intervention.action_time).toLocaleString()
                                            : 'Date inconnue'}
                                </span>
                                </div>
                            </div>
                        </div>
                        <Link
                            href={route('task.show', intervention.task.id)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            Retour au Ticket
                        </Link>
                    </div>
                }
            >
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                        {/* Task Info Card */}
                        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                                    <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                <h3 className="text-xl font-bold text-white">
                                        Ticket Associé
                                </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Détails du ticket lié à cette intervention
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-6 rounded-xl hover:bg-black/30 transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-4">
                                        <TagIcon className="h-5 w-5 text-cyan-400" />
                                        <h4 className="text-lg font-medium text-white">Ticket #{intervention.task.id}</h4>
                                    </div>
                                    <Link 
                                        href={route('task.show', intervention.task.id)} 
                                        className="group flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                    >
                                        <span className="group-hover:underline underline-offset-4">
                                        {intervention.task.name}
                                        </span>
                                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                    </Link>
                                </div>

                                <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-6 rounded-xl hover:bg-black/30 transition-all duration-300">
                                    <div className="flex items-center gap-3 mb-4">
                                        <BuildingOfficeIcon className="h-5 w-5 text-cyan-400" />
                                        <h4 className="text-lg font-medium text-white">Machine(s)</h4>
                                    </div>
                                    {intervention.task.projects && intervention.task.projects.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {intervention.task.projects.map((project) => (
                                                <Link 
                                                    key={project.id}
                                                    href={route('projects.show', project.id)} 
                                                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105"
                                                >
                                                    {project.name}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400">Aucune machine associée</p>
                                    )}
                                    </div>
                            </div>
                        </div>

                        {/* Intervention Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <UserIcon className="h-5 w-5 text-cyan-400" />
                                    <h4 className="text-lg font-medium text-white">Intervenant</h4>
                                </div>
                                <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 px-4 py-2 rounded-xl border border-cyan-500/10">
                                    <UserIcon className="h-4 w-4 text-cyan-400" />
                                    <span className="text-cyan-400 font-medium">{intervention.user?.name || 'Inconnu'}</span>
                                </div>
                                    </div>

                            <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <CalendarIcon className="h-5 w-5 text-cyan-400" />
                                    <h4 className="text-lg font-medium text-white">Date d'Intervention</h4>
                                </div>
                                <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 px-4 py-2 rounded-xl border border-cyan-500/10">
                                    <CalendarIcon className="h-4 w-4 text-cyan-400" />
                                    <span className="text-cyan-400 font-medium">
                                        {intervention.action_time
                                            ? new Date(intervention.action_time).toLocaleString()
                                            : 'Date inconnue'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <ClockIcon className="h-5 w-5 text-cyan-400" />
                                    <h4 className="text-lg font-medium text-white">Statut</h4>
                                </div>
                                <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium shadow-inner ring-1 ring-white/10 ${INTERVENTION_STATUS_CLASS_MAP[intervention.status] || 'bg-gray-500'}`}>
                                    {INTERVENTION_STATUS_TEXT_MAP[intervention.status] || intervention.status}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                                    <DocumentTextIcon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Description</h3>
                                    <p className="text-sm text-gray-400 mt-1">Détails de l'intervention réalisée</p>
                                </div>
                            </div>
                            <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-6 rounded-xl">
                                <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                                    {intervention.description || 'Aucune description fournie'}
                                </p>
                            </div>
                        </div>

                        {/* Intervention Image */}
                        {intervention.image_path && (
                            <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                                        <PhotoIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Image de l'Intervention</h3>
                                        <p className="text-sm text-gray-400 mt-1">Preuve visuelle de l'intervention réalisée</p>
                                    </div>
                                </div>
                                <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-4 rounded-xl">
                                    <a
                                        href={intervention.image_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all duration-300 shadow-lg shadow-black/50 group"
                                    >
                                    <img
                                        src={intervention.image_path}
                                        alt="Intervention"
                                            className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90">
                                                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                                <span className="text-sm font-medium">Voir l'image en plein écran</span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Rejection Details */}
                        {intervention.status === 'rejected' && (
                            <div className="bg-gradient-to-br from-red-950/50 via-red-900/50 to-red-950/50 backdrop-blur-lg border border-red-500/20 rounded-2xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-xl shadow-lg shadow-red-500/20">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-red-400">Détails du Rejet</h3>
                                        <p className="text-sm text-red-300/80 mt-1">Raison du rejet de l'intervention</p>
                                    </div>
                                </div>
                                <div className="bg-black/20 backdrop-blur-sm border border-red-500/20 p-6 rounded-xl">
                                    <p className="text-red-300 leading-relaxed">
                                        {intervention.rejection_comment}
                                    </p>
                                    {intervention.rejection_image_path && (
                                        <div className="mt-6">
                                            <a
                                                href={intervention.rejection_image_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block relative aspect-video rounded-xl overflow-hidden border border-red-500/20 hover:border-red-500/40 transition-all duration-300 shadow-lg shadow-red-500/5 group"
                                            >
                                            <img
                                                src={intervention.rejection_image_path}
                                                alt="Rejection Evidence"
                                                    className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90">
                                                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                                        <span className="text-sm font-medium">Voir l'image en plein écran</span>
                                                    </div>
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Approval Details */}
                        {intervention.status === 'approved' && intervention.rating_comment && (
                            <div className="bg-gradient-to-br from-emerald-950/50 via-emerald-900/50 to-emerald-950/50 backdrop-blur-lg border border-emerald-500/20 rounded-2xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-3 rounded-xl shadow-lg shadow-emerald-500/20">
                                        <CheckIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-emerald-400">Commentaire </h3>
                                        <p className="text-sm text-emerald-300/80 mt-1">Commentaire ajouté lors de l'approbation</p>
                                    </div>
                                </div>
                                <div className="bg-black/20 backdrop-blur-sm border border-emerald-500/20 p-6 rounded-xl">
                                    <p className="text-emerald-300 leading-relaxed">
                                        {intervention.rating_comment}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Approval Controls */}
                        {isTaskCreator && intervention.status === 'pending' && (
                            <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                                        <ClockIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Évaluation de l'Intervention</h3>
                                        <p className="text-sm text-gray-400 mt-1">Approuver ou rejeter cette intervention</p>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col space-y-4">
                                    <div className="bg-black/20 backdrop-blur-sm border border-white/5 p-6 rounded-xl">
                                        <div className="flex items-center justify-between gap-4">
                                    <button
                                                type="button"
                                        onClick={() => setShowApprovalForm(true)}
                                                disabled={isSubmitting}
                                                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckIcon className="w-5 h-5" />
                                                <span>Approuver</span>
                                    </button>
                                    <button
                                                type="button"
                                                onClick={() => setShowRejectionForm(true)}
                                                disabled={isSubmitting}
                                                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                                <span>Rejeter</span>
                                    </button>
                                </div>

                                {/* Approval Form */}
                                        {showApprovalForm && (
                                            <div className="mt-6 border-t border-white/10 pt-6">
                                                <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Commentaire  (Optionnel)
                                                </label>
                                                <textarea
                                                    value={data.rating_comment}
                                                    onChange={e => setData('rating_comment', e.target.value)}
                                                    placeholder="Ajouter un commentaire à votre approbation..."
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/20 transition-all duration-300"
                                                    rows={4}
                                                />
                                                {errors.rating_comment && (
                                                    <p className="mt-2 text-sm text-red-400">{errors.rating_comment}</p>
                                                )}
                                            </div>

                                                    <div className="flex items-center justify-end gap-4 mt-6">
                                                <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowApprovalForm(false);
                                                                setData('rating_comment', '');
                                                            }}
                                                            disabled={isSubmitting}
                                                            className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-white font-medium rounded-xl transition-all duration-300 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                            type="button"
                                                    onClick={handleApprove}
                                                            disabled={isSubmitting}
                                                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                            {isSubmitting ? (
                                                                <>
                                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    <span>Traitement...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckIcon className="w-5 h-5" />
                                                                    <span>Confirmer l'Approbation</span>
                                                                </>
                                                            )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Form */}
                                {showRejectionForm && (
                                    <div className="mt-6 border-t border-white/10 pt-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Raison du Rejet <span className="text-red-400">*</span>
                                                </label>
                                                <textarea
                                                    value={data.rejection_comment}
                                                    onChange={e => setData('rejection_comment', e.target.value)}
                                                    placeholder="Expliquez pourquoi vous rejetez cette intervention..."
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500/20 transition-all duration-300"
                                                    rows={4}
                                                    required
                                                />
                                                {errors.rejection_comment && (
                                                    <p className="mt-2 text-sm text-red-400">{errors.rejection_comment}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                                    Image Justificative (Optionnel)
                                                </label>
                                                <input
                                                    type="file"
                                                    onChange={e => setData('rejection_image', e.target.files[0])}
                                                    accept="image/*"
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500/20 file:text-red-400 hover:file:bg-red-500/30 cursor-pointer"
                                                />
                                                {errors.rejection_image && (
                                                    <p className="mt-2 text-sm text-red-400">{errors.rejection_image}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-end gap-4 mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowRejectionForm(false);
                                                        setData('rejection_comment', '');
                                                        setData('rejection_image', null);
                                                    }}
                                                    disabled={isSubmitting}
                                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-white font-medium rounded-xl transition-all duration-300 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Annuler
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleReject}
                                                    disabled={isSubmitting}
                                                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <span>Traitement...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XMarkIcon className="w-5 h-5" />
                                                            <span>Confirmer le Rejet</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
