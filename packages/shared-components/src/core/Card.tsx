import React from 'react';
import { cn } from '../utils/classnames.js';
import type { BaseComponentProps } from '../types/ui.js';

export interface CardProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

interface CardComponent extends React.FC<CardProps> {
  Header: typeof CardHeader;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
}

export const Card: CardComponent = Object.assign(
  ({ children, className, padding = 'md', hover = false, onClick }: CardProps) => {
    return (
      <div
        className={cn(
          'bg-white rounded-lg shadow-sm border border-gray-200',
          paddingClasses[padding],
          hover && 'transition-shadow hover:shadow-md',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
      >
        {children}
      </div>
    );
  },
  {
    Header: CardHeader,
    Content: CardContent,
    Footer: CardFooter,
  }
);

export interface CardHeaderProps extends BaseComponentProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: CardHeaderProps): React.ReactElement {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className }: BaseComponentProps): React.ReactElement {
  return <div className={cn('mt-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: BaseComponentProps): React.ReactElement {
  return (
    <div className={cn('mt-6 pt-4 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}

// Re-assign after function declarations
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
