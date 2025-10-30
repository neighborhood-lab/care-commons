import React from 'react';
import type { TaskInstance } from '../types';
export interface TaskCompletionModalProps {
    task: TaskInstance;
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}
export declare const TaskCompletionModal: React.FC<TaskCompletionModalProps>;
//# sourceMappingURL=TaskCompletionModal.d.ts.map