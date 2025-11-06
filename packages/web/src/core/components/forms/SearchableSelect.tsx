import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '../../utils/classnames';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  clearable?: boolean;
}

export const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder = 'Select an option...',
      label,
      error,
      helperText,
      required,
      disabled,
      className,
      isLoading,
      onSearch,
      emptyMessage = 'No results found',
      clearable = true,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Filter options based on search query
    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);

    // Call onSearch callback when search query changes
    useEffect(() => {
      if (onSearch && searchQuery) {
        const timeoutId = setTimeout(() => {
          onSearch(searchQuery);
        }, 300); // Debounce search

        return () => clearTimeout(timeoutId);
      }
    }, [searchQuery, onSearch]);

    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setSearchQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <button
            ref={ref}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={label ? `${label}-label` : undefined}
            className={cn(
              'relative w-full flex items-center justify-between gap-2',
              'rounded-md border border-gray-300 bg-white px-3 py-2',
              'text-left shadow-sm cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              isOpen && 'ring-2 ring-primary-500 border-primary-500'
            )}
          >
            <span className={cn(
              'block truncate',
              !selectedOption && 'text-gray-400'
            )}>
              {selectedOption?.label || placeholder}
            </span>
            <div className="flex items-center gap-1">
              {clearable && selectedOption && !disabled && (
                <X
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
                  onClick={handleClear}
                  aria-label="Clear selection"
                />
              )}
              <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
          </button>

          {isOpen && (
            <div
              className={cn(
                'absolute z-50 mt-1 w-full',
                'rounded-md border border-gray-200 bg-white shadow-lg',
                'max-h-60 overflow-hidden'
              )}
              role="listbox"
            >
              {/* Search Input */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search..."
                    className={cn(
                      'w-full pl-9 pr-3 py-2 text-sm',
                      'border border-gray-300 rounded-md',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    )}
                    aria-label="Search options"
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="overflow-y-auto max-h-48">
                {isLoading ? (
                  <div className="px-3 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-gray-500">
                    {emptyMessage}
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      role="option"
                      aria-selected={option.value === value}
                      className={cn(
                        'w-full flex items-start justify-between gap-2 px-3 py-2 text-left',
                        'hover:bg-gray-50 cursor-pointer transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        option.value === value && 'bg-primary-50 text-primary-900'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {option.value === value && (
                        <Check className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';
