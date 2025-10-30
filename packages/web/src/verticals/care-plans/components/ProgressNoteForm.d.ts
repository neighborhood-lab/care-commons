import React from 'react';
import type { ProgressNote } from '../types';
export interface ProgressNoteFormProps {
    carePlanId: string;
    clientId: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<ProgressNote, 'id' | 'carePlanId' | 'clientId' | 'authorId' | 'authorName' | 'authorRole' | 'noteDate' | 'createdAt' | 'updatedAt' | 'reviewedBy' | 'reviewedAt' | 'approved'>) => void;
    isLoading?: boolean;
    authorInfo: {
        id: string;
        name: string;
        role: string;
    };
}
export declare const ProgressNoteForm: React.FC<ProgressNoteFormProps>;
//# sourceMappingURL=ProgressNoteForm.d.ts.map