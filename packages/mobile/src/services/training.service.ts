/**
 * Training Service
 *
 * Manages offline-first access to training modules for caregivers.
 * Features:
 * - View required and optional training modules
 * - Track completion progress
 * - Mark modules as complete with quiz scores
 * - Sync training completions when online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TRAINING_STORAGE_KEY = 'training_modules';
const TRAINING_PROGRESS_KEY = 'training_progress';

export type TrainingCategory =
  | 'ORIENTATION'
  | 'SAFETY'
  | 'CLINICAL'
  | 'COMPLIANCE'
  | 'SOFT_SKILLS'
  | 'SPECIALTY';

export type TrainingStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED';

export type TrainingFormat =
  | 'VIDEO'
  | 'DOCUMENT'
  | 'INTERACTIVE'
  | 'QUIZ';

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: TrainingCategory;
  format: TrainingFormat;
  durationMinutes: number;
  isRequired: boolean;
  dueDate?: Date;
  expiresAfterDays?: number; // Recertification period
  contentUrl?: string;
  thumbnailUrl?: string;
  order: number;
}

export interface TrainingProgress {
  moduleId: string;
  status: TrainingStatus;
  startedAt?: Date;
  completedAt?: Date;
  quizScore?: number;
  passingScore?: number;
  attempts: number;
  lastViewedSection?: string;
  expiresAt?: Date;
  syncPending: boolean;
}

export interface TrainingModuleWithProgress extends TrainingModule {
  progress: TrainingProgress;
}

export interface TrainingStats {
  totalModules: number;
  completedModules: number;
  requiredModules: number;
  requiredCompleted: number;
  overdueCount: number;
  expiringCount: number; // Expiring in next 30 days
  totalMinutesCompleted: number;
  totalMinutesRemaining: number;
}

class TrainingService {
  private modules: Map<string, TrainingModule> = new Map();
  private progress: Map<string, TrainingProgress> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load cached modules
      const storedModules = await AsyncStorage.getItem(TRAINING_STORAGE_KEY);
      if (storedModules) {
        const parsed = JSON.parse(storedModules);
        parsed.forEach((m: TrainingModule) => {
          this.modules.set(m.id, {
            ...m,
            dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
          });
        });
      }

      // Load progress
      const storedProgress = await AsyncStorage.getItem(TRAINING_PROGRESS_KEY);
      if (storedProgress) {
        const parsed = JSON.parse(storedProgress);
        parsed.forEach((p: TrainingProgress) => {
          this.progress.set(p.moduleId, {
            ...p,
            startedAt: p.startedAt ? new Date(p.startedAt) : undefined,
            completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
            expiresAt: p.expiresAt ? new Date(p.expiresAt) : undefined,
          });
        });
      }

      // If no modules, load mock data
      if (this.modules.size === 0) {
        await this.loadMockModules();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize training service:', error);
      await this.loadMockModules();
      this.initialized = true;
    }
  }

  private async loadMockModules(): Promise<void> {
    const mockModules: TrainingModule[] = [
      // Orientation
      {
        id: 'tr-1',
        title: 'New Caregiver Orientation',
        description: 'Welcome to Folk Care! This module covers our mission, values, and basic procedures.',
        category: 'ORIENTATION',
        format: 'VIDEO',
        durationMinutes: 45,
        isRequired: true,
        order: 1,
      },
      {
        id: 'tr-2',
        title: 'EVV System Training',
        description: 'Learn how to use the electronic visit verification system for clock-in/out.',
        category: 'ORIENTATION',
        format: 'INTERACTIVE',
        durationMinutes: 30,
        isRequired: true,
        order: 2,
      },
      // Safety
      {
        id: 'tr-3',
        title: 'Infection Control & Prevention',
        description: 'Essential practices for preventing the spread of infections in home care settings.',
        category: 'SAFETY',
        format: 'VIDEO',
        durationMinutes: 40,
        isRequired: true,
        expiresAfterDays: 365,
        order: 3,
      },
      {
        id: 'tr-4',
        title: 'Fall Prevention',
        description: 'Strategies and techniques to prevent falls in elderly and disabled clients.',
        category: 'SAFETY',
        format: 'VIDEO',
        durationMinutes: 25,
        isRequired: true,
        order: 4,
      },
      {
        id: 'tr-5',
        title: 'Emergency Response Procedures',
        description: 'What to do in medical emergencies, natural disasters, and other crisis situations.',
        category: 'SAFETY',
        format: 'INTERACTIVE',
        durationMinutes: 35,
        isRequired: true,
        order: 5,
      },
      // Clinical
      {
        id: 'tr-6',
        title: 'Medication Administration Basics',
        description: 'Safe medication handling, administration, and documentation procedures.',
        category: 'CLINICAL',
        format: 'VIDEO',
        durationMinutes: 50,
        isRequired: true,
        expiresAfterDays: 365,
        order: 6,
      },
      {
        id: 'tr-7',
        title: 'Vital Signs Monitoring',
        description: 'How to accurately measure and record vital signs.',
        category: 'CLINICAL',
        format: 'INTERACTIVE',
        durationMinutes: 30,
        isRequired: false,
        order: 7,
      },
      {
        id: 'tr-8',
        title: 'Personal Care Assistance',
        description: 'Best practices for bathing, grooming, and dressing assistance.',
        category: 'CLINICAL',
        format: 'VIDEO',
        durationMinutes: 40,
        isRequired: true,
        order: 8,
      },
      // Compliance
      {
        id: 'tr-9',
        title: 'HIPAA Privacy & Security',
        description: 'Understanding patient privacy rights and your responsibilities.',
        category: 'COMPLIANCE',
        format: 'QUIZ',
        durationMinutes: 30,
        isRequired: true,
        expiresAfterDays: 365,
        order: 9,
      },
      {
        id: 'tr-10',
        title: 'Abuse & Neglect Prevention',
        description: 'Recognizing and reporting signs of abuse and neglect.',
        category: 'COMPLIANCE',
        format: 'VIDEO',
        durationMinutes: 45,
        isRequired: true,
        expiresAfterDays: 365,
        order: 10,
      },
      // Soft Skills
      {
        id: 'tr-11',
        title: 'Effective Communication',
        description: 'Communication techniques for working with clients and families.',
        category: 'SOFT_SKILLS',
        format: 'VIDEO',
        durationMinutes: 25,
        isRequired: false,
        order: 11,
      },
      {
        id: 'tr-12',
        title: 'Cultural Competency',
        description: 'Providing culturally sensitive care to diverse populations.',
        category: 'SOFT_SKILLS',
        format: 'VIDEO',
        durationMinutes: 35,
        isRequired: false,
        order: 12,
      },
      // Specialty
      {
        id: 'tr-13',
        title: 'Dementia & Alzheimer\'s Care',
        description: 'Specialized techniques for caring for clients with cognitive impairment.',
        category: 'SPECIALTY',
        format: 'VIDEO',
        durationMinutes: 60,
        isRequired: false,
        order: 13,
      },
      {
        id: 'tr-14',
        title: 'Diabetes Management Support',
        description: 'Supporting clients with diabetes, including blood sugar monitoring.',
        category: 'SPECIALTY',
        format: 'INTERACTIVE',
        durationMinutes: 40,
        isRequired: false,
        order: 14,
      },
    ];

    // Set due dates for required modules
    const now = new Date();
    mockModules.forEach((m) => {
      if (m.isRequired && !this.progress.has(m.id)) {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + 30); // 30 days to complete
        m.dueDate = dueDate;
      }
      this.modules.set(m.id, m);
    });

    // Set mock progress
    const mockProgress: TrainingProgress[] = [
      {
        moduleId: 'tr-1',
        status: 'COMPLETED',
        startedAt: new Date('2025-10-15'),
        completedAt: new Date('2025-10-15'),
        attempts: 1,
        syncPending: false,
      },
      {
        moduleId: 'tr-2',
        status: 'COMPLETED',
        startedAt: new Date('2025-10-16'),
        completedAt: new Date('2025-10-16'),
        quizScore: 95,
        passingScore: 80,
        attempts: 1,
        syncPending: false,
      },
      {
        moduleId: 'tr-3',
        status: 'IN_PROGRESS',
        startedAt: new Date('2025-11-20'),
        lastViewedSection: 'hand-washing-techniques',
        attempts: 1,
        syncPending: false,
      },
      {
        moduleId: 'tr-9',
        status: 'EXPIRED',
        startedAt: new Date('2024-01-10'),
        completedAt: new Date('2024-01-10'),
        quizScore: 88,
        passingScore: 80,
        attempts: 1,
        expiresAt: new Date('2025-01-10'),
        syncPending: false,
      },
    ];

    mockProgress.forEach((p) => {
      this.progress.set(p.moduleId, p);
    });

    await this.saveToStorage();
  }

  private async saveToStorage(): Promise<void> {
    try {
      const modulesArray = Array.from(this.modules.values());
      await AsyncStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(modulesArray));

      const progressArray = Array.from(this.progress.values());
      await AsyncStorage.setItem(TRAINING_PROGRESS_KEY, JSON.stringify(progressArray));
    } catch (error) {
      console.error('Failed to save training data:', error);
    }
  }

  async getAllModules(): Promise<TrainingModuleWithProgress[]> {
    await this.initialize();

    const modulesWithProgress: TrainingModuleWithProgress[] = [];

    this.modules.forEach((module) => {
      const progress = this.progress.get(module.id) || {
        moduleId: module.id,
        status: 'NOT_STARTED' as TrainingStatus,
        attempts: 0,
        syncPending: false,
      };

      modulesWithProgress.push({
        ...module,
        progress,
      });
    });

    // Sort by order
    modulesWithProgress.sort((a, b) => a.order - b.order);

    return modulesWithProgress;
  }

  async getModulesByCategory(category: TrainingCategory): Promise<TrainingModuleWithProgress[]> {
    const all = await this.getAllModules();
    return all.filter((m) => m.category === category);
  }

  async getRequiredModules(): Promise<TrainingModuleWithProgress[]> {
    const all = await this.getAllModules();
    return all.filter((m) => m.isRequired);
  }

  async getOverdueModules(): Promise<TrainingModuleWithProgress[]> {
    const all = await this.getAllModules();
    const now = new Date();

    return all.filter((m) => {
      // Check if expired (recertification needed)
      if (m.progress.status === 'EXPIRED') return true;

      // Check if due date has passed and not completed
      if (m.dueDate && m.progress.status !== 'COMPLETED') {
        return new Date(m.dueDate) < now;
      }

      return false;
    });
  }

  async getStats(): Promise<TrainingStats> {
    const all = await this.getAllModules();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const requiredModules = all.filter((m) => m.isRequired);
    const completedModules = all.filter((m) => m.progress.status === 'COMPLETED');
    const requiredCompleted = requiredModules.filter((m) => m.progress.status === 'COMPLETED');

    const overdueModules = all.filter((m) => {
      if (m.progress.status === 'EXPIRED') return true;
      if (m.isRequired && m.dueDate && m.progress.status !== 'COMPLETED') {
        return new Date(m.dueDate) < now;
      }
      return false;
    });

    const expiringModules = all.filter((m) => {
      if (m.progress.expiresAt) {
        const expDate = new Date(m.progress.expiresAt);
        return expDate > now && expDate <= thirtyDaysFromNow;
      }
      return false;
    });

    const totalMinutesCompleted = completedModules.reduce(
      (sum, m) => sum + m.durationMinutes,
      0
    );

    const totalMinutesRemaining = all
      .filter((m) => m.progress.status !== 'COMPLETED')
      .reduce((sum, m) => sum + m.durationMinutes, 0);

    return {
      totalModules: all.length,
      completedModules: completedModules.length,
      requiredModules: requiredModules.length,
      requiredCompleted: requiredCompleted.length,
      overdueCount: overdueModules.length,
      expiringCount: expiringModules.length,
      totalMinutesCompleted,
      totalMinutesRemaining,
    };
  }

  async startModule(moduleId: string): Promise<void> {
    await this.initialize();

    const existing = this.progress.get(moduleId);
    const now = new Date();

    if (!existing || existing.status === 'NOT_STARTED' || existing.status === 'EXPIRED') {
      this.progress.set(moduleId, {
        moduleId,
        status: 'IN_PROGRESS',
        startedAt: now,
        attempts: (existing?.attempts || 0) + 1,
        syncPending: true,
      });
    } else if (existing.status === 'IN_PROGRESS') {
      // Already in progress, just update last viewed time
      this.progress.set(moduleId, {
        ...existing,
        syncPending: true,
      });
    }

    await this.saveToStorage();
  }

  async updateProgress(
    moduleId: string,
    section: string
  ): Promise<void> {
    await this.initialize();

    const existing = this.progress.get(moduleId);
    if (existing) {
      this.progress.set(moduleId, {
        ...existing,
        lastViewedSection: section,
        syncPending: true,
      });
      await this.saveToStorage();
    }
  }

  async completeModule(
    moduleId: string,
    quizScore?: number,
    passingScore?: number
  ): Promise<boolean> {
    await this.initialize();

    const module = this.modules.get(moduleId);
    const existing = this.progress.get(moduleId);

    if (!module) return false;

    // Check if quiz passed (if applicable)
    if (passingScore && quizScore !== undefined && quizScore < passingScore) {
      // Failed quiz
      if (existing) {
        this.progress.set(moduleId, {
          ...existing,
          quizScore,
          passingScore,
          syncPending: true,
        });
        await this.saveToStorage();
      }
      return false;
    }

    const now = new Date();
    let expiresAt: Date | undefined;

    if (module.expiresAfterDays) {
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + module.expiresAfterDays);
    }

    this.progress.set(moduleId, {
      moduleId,
      status: 'COMPLETED',
      startedAt: existing?.startedAt || now,
      completedAt: now,
      quizScore,
      passingScore,
      attempts: existing?.attempts || 1,
      expiresAt,
      syncPending: true,
    });

    await this.saveToStorage();
    return true;
  }

  async getPendingSyncs(): Promise<TrainingProgress[]> {
    await this.initialize();

    const pending: TrainingProgress[] = [];
    this.progress.forEach((p) => {
      if (p.syncPending) {
        pending.push(p);
      }
    });

    return pending;
  }

  async markSynced(moduleIds: string[]): Promise<void> {
    await this.initialize();

    moduleIds.forEach((id) => {
      const existing = this.progress.get(id);
      if (existing) {
        this.progress.set(id, {
          ...existing,
          syncPending: false,
        });
      }
    });

    await this.saveToStorage();
  }
}

// Singleton instance
export const trainingService = new TrainingService();

// Helper functions
export function getCategoryLabel(category: TrainingCategory): string {
  const labels: Record<TrainingCategory, string> = {
    ORIENTATION: 'Orientation',
    SAFETY: 'Safety',
    CLINICAL: 'Clinical Skills',
    COMPLIANCE: 'Compliance',
    SOFT_SKILLS: 'Soft Skills',
    SPECIALTY: 'Specialty Care',
  };
  return labels[category];
}

export function getCategoryIcon(category: TrainingCategory): string {
  const icons: Record<TrainingCategory, string> = {
    ORIENTATION: '🎓',
    SAFETY: '🛡️',
    CLINICAL: '💊',
    COMPLIANCE: '📋',
    SOFT_SKILLS: '💬',
    SPECIALTY: '⭐',
  };
  return icons[category];
}

export function getFormatIcon(format: TrainingFormat): string {
  const icons: Record<TrainingFormat, string> = {
    VIDEO: '🎬',
    DOCUMENT: '📄',
    INTERACTIVE: '🖱️',
    QUIZ: '✏️',
  };
  return icons[format];
}

export function getStatusInfo(status: TrainingStatus): {
  label: string;
  color: string;
  badgeVariant: 'success' | 'warning' | 'danger' | 'secondary';
} {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', color: '#10B981', badgeVariant: 'success' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', color: '#F59E0B', badgeVariant: 'warning' };
    case 'EXPIRED':
      return { label: 'Expired', color: '#EF4444', badgeVariant: 'danger' };
    case 'NOT_STARTED':
    default:
      return { label: 'Not Started', color: '#6B7280', badgeVariant: 'secondary' };
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
