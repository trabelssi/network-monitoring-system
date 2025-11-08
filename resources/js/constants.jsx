// ✅ Task Status Color Mapping
export const TASK_STATUS_CLASS_MAP = {
    'pending': 'bg-amber-500',
    'in-progress': 'bg-blue-500',
    'completed': 'bg-green-500',
  };
  
  // ✅ Task Status Text Mapping
  export const TASK_STATUS_TEXT_MAP = {
    'pending': 'En Attente',
    'in-progress': 'En Cours',
    'completed': 'Terminé',
  };
  
  // ✅ Task Priority Color Mapping
  export const TASK_PRIORITY_CLASS_MAP = {
    'low': 'bg-gray-600',
    'medium': 'bg-amber-600',
    'high': 'bg-red-600',
  };
  
  // ✅ Task Priority Text Mapping
  export const TASK_PRIORITY_TEXT_MAP = {
    'low': 'Basse',
    'medium': 'Moyenne',
    'high': 'Haute',
  };
  export const INTERVENTION_STATUS_CLASS_MAP = {
    pending: 'bg-yellow-500',
    submitted: 'bg-blue-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
};

export const INTERVENTION_STATUS_TEXT_MAP = {
    pending: 'En Attente',
    submitted: 'Soumis',
    approved: 'Approuvé',
    rejected: 'Rejeté',
};

export const USER_STATUS_CLASS_MAP = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800',
};

export const USER_STATUS_TEXT_MAP = {
    'active': 'Actif',
    'inactive': 'Inactif',
    'pending': 'En Attente',
};
