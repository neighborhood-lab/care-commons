import React from 'react';
import type { BaseComponentProps } from '../types/ui';
export interface CardProps extends BaseComponentProps {
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}
export declare const Card: React.FC<CardProps>;
export interface CardHeaderProps extends BaseComponentProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}
export declare const CardHeader: React.FC<CardHeaderProps>;
export declare const CardContent: React.FC<BaseComponentProps>;
export declare const CardFooter: React.FC<BaseComponentProps>;
//# sourceMappingURL=Card.d.ts.map