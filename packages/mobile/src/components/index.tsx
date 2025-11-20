/**
 * Shared UI Components for Mobile App
 *
 * Basic UI components using React Native Paper and native components
 */

import React from 'react';

// Export conflict resolution modal
export { ConflictResolutionModal } from './ConflictResolutionModal';
export { OfflineIndicator } from './OfflineIndicator';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

// ============================================================================
// Button Component
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled,
  loading,
  style,
  children,
}: ButtonProps) {
  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    danger: styles.buttonDanger,
  };

  const sizeStyles = {
    sm: styles.buttonSm,
    md: styles.buttonMd,
    lg: styles.buttonLg,
  };

  const textVariantStyles = {
    primary: styles.buttonPrimaryText,
    secondary: styles.buttonSecondaryText,
    danger: styles.buttonDangerText,
  };

  const textSizeStyles = {
    sm: styles.buttonSmText,
    md: styles.buttonMdText,
    lg: styles.buttonLgText,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? '#2563EB' : '#FFFFFF'}
        />
      ) : (
        <Text style={[styles.buttonText, textVariantStyles[variant], textSizeStyles[size]]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

// ============================================================================
// Badge Component
// ============================================================================

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Badge({ variant = 'primary', size = 'md', style, children }: BadgeProps) {
  const variantStyles = {
    primary: styles.badgePrimary,
    secondary: styles.badgeSecondary,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    danger: styles.badgeDanger,
  };

  const sizeStyles = {
    sm: styles.badgeSm,
    md: styles.badgeMd,
    lg: styles.badgeLg,
  };

  const textVariantStyles = {
    primary: styles.badgePrimaryText,
    secondary: styles.badgeSecondaryText,
    success: styles.badgeSuccessText,
    warning: styles.badgeWarningText,
    danger: styles.badgeDangerText,
  };

  const textSizeStyles = {
    sm: styles.badgeSmText,
    md: styles.badgeMdText,
    lg: styles.badgeLgText,
  };

  return (
    <View style={[styles.badge, variantStyles[variant], sizeStyles[size], style]}>
      <Text style={[styles.badgeText, textVariantStyles[variant], textSizeStyles[size]]}>
        {children}
      </Text>
    </View>
  );
}

// ============================================================================
// Card Component
// ============================================================================

interface CardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function Card({ style, children }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardContent({ style, children }: CardProps) {
  return <View style={[styles.cardContent, style]}>{children}</View>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Button styles
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonDanger: {
    backgroundColor: '#DC2626',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonMd: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonLg: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontWeight: '600',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    color: '#374151',
  },
  buttonDangerText: {
    color: '#FFFFFF',
  },
  buttonSmText: {
    fontSize: 12,
  },
  buttonMdText: {
    fontSize: 14,
  },
  buttonLgText: {
    fontSize: 16,
  },

  // Badge styles
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgePrimary: {
    backgroundColor: '#DBEAFE',
  },
  badgeSecondary: {
    backgroundColor: '#F3F4F6',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLg: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontWeight: '500',
    fontSize: 12,
  },
  badgePrimaryText: {
    color: '#1E40AF',
  },
  badgeSecondaryText: {
    color: '#4B5563',
  },
  badgeSuccessText: {
    color: '#065F46',
  },
  badgeWarningText: {
    color: '#92400E',
  },
  badgeDangerText: {
    color: '#991B1B',
  },
  badgeSmText: {
    fontSize: 10,
  },
  badgeMdText: {
    fontSize: 12,
  },
  badgeLgText: {
    fontSize: 14,
  },

  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
});
