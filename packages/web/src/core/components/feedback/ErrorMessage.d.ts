import React from 'react';
export interface ErrorMessageProps {
    title?: string;
    message: string;
    retry?: () => void;
    className?: string;
}
export declare const ErrorMessage: React.FC<ErrorMessageProps>;
//# sourceMappingURL=ErrorMessage.d.ts.map