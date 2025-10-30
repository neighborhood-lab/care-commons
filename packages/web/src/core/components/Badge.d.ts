import React from 'react';
import type { Status } from '../types/ui';
export interface BadgeProps {
    children: React.ReactNode;
    variant?: Status | 'default';
    size?: 'sm' | 'md';
    className?: string;
}
export declare const Badge: React.FC<BadgeProps>;
export declare const StatusBadge: React.FC<{
    status: string;
}>;
//# sourceMappingURL=Badge.d.ts.map