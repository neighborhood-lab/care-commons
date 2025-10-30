import React from 'react';
import type { CreateCarePlanInput } from '../types';
export interface CarePlanFormProps {
    initialData?: Partial<CreateCarePlanInput>;
    onSubmit: (data: CreateCarePlanInput) => void;
    isLoading?: boolean;
}
export declare const CarePlanForm: React.FC<CarePlanFormProps>;
//# sourceMappingURL=CarePlanForm.d.ts.map