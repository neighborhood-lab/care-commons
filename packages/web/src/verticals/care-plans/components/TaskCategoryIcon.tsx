import React from 'react';
import {
  Droplet,
  Shirt,
  Scissors,
  Home,
  User,
  Activity,
  Users,
  Pill,
  UtensilsCrossed,
  Utensils,
  Sparkles,
  Wind,
  ShoppingCart,
  Car,
  Heart,
  Eye,
  FileText,
  HelpCircle,
} from 'lucide-react';
import type { TaskCategory } from '../types';

export interface TaskCategoryIconProps {
  category: TaskCategory;
  className?: string;
}

export const TaskCategoryIcon: React.FC<TaskCategoryIconProps> = ({ category, className = 'h-5 w-5' }) => {
  const iconMap: Record<TaskCategory, React.ReactElement> = {
    PERSONAL_HYGIENE: <Droplet className={className} />,
    BATHING: <Droplet className={className} />,
    DRESSING: <Shirt className={className} />,
    GROOMING: <Scissors className={className} />,
    TOILETING: <Home className={className} />,
    MOBILITY: <Activity className={className} />,
    TRANSFERRING: <Users className={className} />,
    AMBULATION: <Activity className={className} />,
    MEDICATION: <Pill className={className} />,
    MEAL_PREPARATION: <UtensilsCrossed className={className} />,
    FEEDING: <Utensils className={className} />,
    HOUSEKEEPING: <Sparkles className={className} />,
    LAUNDRY: <Wind className={className} />,
    SHOPPING: <ShoppingCart className={className} />,
    TRANSPORTATION: <Car className={className} />,
    COMPANIONSHIP: <Heart className={className} />,
    MONITORING: <Eye className={className} />,
    DOCUMENTATION: <FileText className={className} />,
    OTHER: <HelpCircle className={className} />,
  };

  return iconMap[category] || <User className={className} />;
};

export const getTaskCategoryLabel = (category: TaskCategory): string => {
  const labels: Record<TaskCategory, string> = {
    PERSONAL_HYGIENE: 'Personal Hygiene',
    BATHING: 'Bathing',
    DRESSING: 'Dressing',
    GROOMING: 'Grooming',
    TOILETING: 'Toileting',
    MOBILITY: 'Mobility',
    TRANSFERRING: 'Transferring',
    AMBULATION: 'Ambulation',
    MEDICATION: 'Medication',
    MEAL_PREPARATION: 'Meal Preparation',
    FEEDING: 'Feeding',
    HOUSEKEEPING: 'Housekeeping',
    LAUNDRY: 'Laundry',
    SHOPPING: 'Shopping',
    TRANSPORTATION: 'Transportation',
    COMPANIONSHIP: 'Companionship',
    MONITORING: 'Monitoring',
    DOCUMENTATION: 'Documentation',
    OTHER: 'Other',
  };

  return labels[category] || category;
};

export const getTaskCategoryColor = (category: TaskCategory): string => {
  const colors: Record<TaskCategory, string> = {
    PERSONAL_HYGIENE: 'text-blue-600',
    BATHING: 'text-cyan-600',
    DRESSING: 'text-purple-600',
    GROOMING: 'text-pink-600',
    TOILETING: 'text-indigo-600',
    MOBILITY: 'text-green-600',
    TRANSFERRING: 'text-teal-600',
    AMBULATION: 'text-lime-600',
    MEDICATION: 'text-red-600',
    MEAL_PREPARATION: 'text-orange-600',
    FEEDING: 'text-amber-600',
    HOUSEKEEPING: 'text-yellow-600',
    LAUNDRY: 'text-sky-600',
    SHOPPING: 'text-violet-600',
    TRANSPORTATION: 'text-fuchsia-600',
    COMPANIONSHIP: 'text-rose-600',
    MONITORING: 'text-emerald-600',
    DOCUMENTATION: 'text-slate-600',
    OTHER: 'text-gray-600',
  };

  return colors[category] || 'text-gray-600';
};
