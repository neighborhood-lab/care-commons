import React from 'react';
export interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    helperText?: string;
    children: React.ReactNode;
    className?: string;
}
export declare const FormField: React.FC<FormFieldProps>;
//# sourceMappingURL=FormField.d.ts.map