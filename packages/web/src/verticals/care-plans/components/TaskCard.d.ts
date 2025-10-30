import React from 'react';
import type { TaskInstance } from '../types';
export interface TaskCardProps {
    task: TaskInstance;
    showCompleteButton?: boolean;
    onCompleted?: () => void;
}
export declare const TaskCard: React.FC<TaskCardProps>;
//# sourceMappingURL=TaskCard.d.ts.map