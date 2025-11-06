import toast from 'react-hot-toast';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Toast notification utilities
 * Wraps react-hot-toast with consistent styling and defaults
 */
export const toastService = {
  /**
   * Show a success toast notification
   */
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration ?? 4000,
      position: options?.position ?? 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: options?.duration ?? 5000,
      position: options?.position ?? 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    });
  },

  /**
   * Show an info toast notification
   */
  info: (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: options?.duration ?? 4000,
      position: options?.position ?? 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: options?.duration ?? 4000,
      position: options?.position ?? 'top-right',
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Show a loading toast notification
   * Returns a toast id that can be used to dismiss or update the toast
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      position: options?.position ?? 'top-right',
      style: {
        background: '#6B7280',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },

  /**
   * Show a promise-based toast notification
   * Automatically shows loading, success, or error based on promise state
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      messages,
      {
        position: options?.position ?? 'top-right',
        style: {
          padding: '16px',
          borderRadius: '8px',
        },
        success: {
          style: {
            background: '#10B981',
            color: '#fff',
          },
        },
        error: {
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        },
        loading: {
          style: {
            background: '#6B7280',
            color: '#fff',
          },
        },
      }
    );
  },

  /**
   * Dismiss a specific toast by id
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Show a custom toast notification
   */
  custom: (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: options?.duration ?? 4000,
      position: options?.position ?? 'top-right',
    });
  },
};
