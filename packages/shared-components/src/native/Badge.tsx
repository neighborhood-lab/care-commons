/**
 * Platform-agnostic Badge Component (React Native)
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import type { Size, Status, Variant } from '../types/ui.js';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant | Status;
  size?: Size;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const colors = {
  primary: { bg: '#DBEAFE', text: '#1E40AF' },
  secondary: { bg: '#F3F4F6', text: '#374151' },
  outline: { bg: 'transparent', text: '#374151', border: '#D1D5DB' },
  ghost: { bg: 'transparent', text: '#374151' },
  danger: { bg: '#FEE2E2', text: '#991B1B' },
  success: { bg: '#D1FAE5', text: '#065F46' },
  error: { bg: '#FEE2E2', text: '#991B1B' },
  warning: { bg: '#FEF3C7', text: '#92400E' },
  info: { bg: '#DBEAFE', text: '#1E40AF' },
};

const sizes = {
  xs: { paddingVertical: 2, paddingHorizontal: 6, fontSize: 10 },
  sm: { paddingVertical: 2, paddingHorizontal: 8, fontSize: 12 },
  md: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12 },
  lg: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 14 },
  xl: { paddingVertical: 6, paddingHorizontal: 14, fontSize: 14 },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  const variantColors = colors[variant];
  const sizeConfig = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantColors.bg,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          ...(variant === 'outline' && {
            borderWidth: 1,
            borderColor: colors.outline.border,
          }),
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: variantColors.text,
            fontSize: sizeConfig.fontSize,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

// Status Badge with predefined status variants
export interface StatusBadgeProps {
  status: Status;
  size?: Size;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', style, textStyle }) => {
  const labels: Record<Status, string> = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };

  return (
    <Badge variant={status} size={size} style={style} textStyle={textStyle}>
      {labels[status]}
    </Badge>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
});

Badge.displayName = 'Badge';
StatusBadge.displayName = 'StatusBadge';
