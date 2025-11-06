import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { Button } from '../Button';
import { cn } from '../../utils/classnames';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  confirmButtonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info',
  isLoading = false,
  confirmButtonVariant,
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const buttonVariant = confirmButtonVariant || (variant === 'danger' ? 'danger' : 'primary');

  // Handle ESC key press
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl max-w-md w-full',
          'animate-in zoom-in-95 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={cn(
            'absolute top-4 right-4 p-1 rounded-md',
            'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={cn(
                'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                config.bgColor,
                'ring-8 ring-opacity-20',
                variant === 'danger' && 'ring-red-100',
                variant === 'warning' && 'ring-yellow-100',
                variant === 'info' && 'ring-blue-100',
                variant === 'success' && 'ring-green-100'
              )}
            >
              <Icon className={cn('h-6 w-6', config.iconColor)} aria-hidden="true" />
            </div>
            <div className="flex-1 pt-1">
              <h3
                id="dialog-title"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
                {title}
              </h3>
              <p id="dialog-description" className="text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={buttonVariant}
              onClick={handleConfirm}
              isLoading={isLoading}
              disabled={isLoading}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for easier usage
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: '',
    message: '',
  });
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = (dialogConfig: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'isLoading'>) => {
    setConfig(dialogConfig);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
  };

  return {
    isOpen,
    config,
    confirm,
    handleClose,
    handleConfirm,
  };
};
