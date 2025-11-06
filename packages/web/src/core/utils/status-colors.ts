/**
 * Generic status color utilities
 * Provides consistent badge colors across all verticals
 */

/**
 * Common status color mappings used across the application
 */
export const STATUS_COLORS = {
  // Draft/Initial states
  DRAFT: 'bg-gray-100 text-gray-800',

  // Processing/In-Progress states
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  CALCULATING: 'bg-blue-100 text-blue-800',
  CALCULATED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  PROCESSED: 'bg-purple-100 text-purple-800',

  // Pending/Waiting states
  PENDING: 'bg-yellow-100 text-yellow-800',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  PENDING_INTAKE: 'bg-yellow-100 text-yellow-800',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-800',

  // Approved/Sent states
  APPROVED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-indigo-100 text-indigo-800',

  // Active/Success states
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-green-100 text-green-800',
  PAID: 'bg-green-100 text-green-800',
  FUNDED: 'bg-teal-100 text-teal-800',

  // Partial states
  PARTIALLY_PAID: 'bg-orange-100 text-orange-800',

  // Warning/Issue states
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  PAST_DUE: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-purple-100 text-purple-800',

  // Inactive/Terminal states
  INACTIVE: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  VOIDED: 'bg-gray-100 text-gray-800',
  DISCHARGED: 'bg-gray-100 text-gray-800',

  // Error states
  FAILED: 'bg-red-100 text-red-800',

  // Special vertical states
  OPEN: 'bg-green-100 text-green-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  FILLED: 'bg-indigo-100 text-indigo-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

/**
 * Get Tailwind CSS classes for a status badge
 * @param status - The status value (case-insensitive)
 * @param defaultColor - Optional default color if status not found
 * @returns Tailwind CSS classes for badge styling
 */
export function getStatusColor(
  status: string,
  defaultColor: string = 'bg-gray-100 text-gray-800'
): string {
  const normalizedStatus = status.toUpperCase() as StatusColorKey;
  return STATUS_COLORS[normalizedStatus] || defaultColor;
}

/**
 * Format a status string for display (replace underscores with spaces)
 * @param status - The status value to format
 * @returns Formatted status string
 */
export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

/**
 * Create a status-specific color getter function
 * Useful for verticals that need type-safe status colors
 *
 * @example
 * ```typescript
 * type InvoiceStatus = 'DRAFT' | 'PAID' | 'VOIDED';
 * const getInvoiceStatusColor = createStatusColorGetter<InvoiceStatus>();
 * const color = getInvoiceStatusColor('PAID'); // returns 'bg-green-100 text-green-800'
 * ```
 */
export function createStatusColorGetter<T extends string>(
  customColors?: Partial<Record<T, string>>
) {
  return (status: T): string => {
    if (customColors && status in customColors) {
      return customColors[status]!;
    }
    return getStatusColor(status);
  };
}
