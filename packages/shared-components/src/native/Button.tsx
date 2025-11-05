/**
 * Platform-agnostic Button Component (React Native)
 * 
 * This button works on both React Native (mobile) and React Native Web (web).
 * Uses Pressable for cross-platform touch handling.
 */

import React from 'react';
import { Pressable, Text, ActivityIndicator, View, StyleSheet, type PressableProps, type ViewStyle, type TextStyle } from 'react-native';
import type { Size, Variant } from '../types/ui.js';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Color definitions that work on all platforms
const colors = {
  primary: {
    bg: '#2563EB',
    bgHover: '#1D4ED8',
    text: '#FFFFFF',
  },
  secondary: {
    bg: '#E5E7EB',
    bgHover: '#D1D5DB',
    text: '#111827',
  },
  outline: {
    bg: '#FFFFFF',
    bgHover: '#F9FAFB',
    text: '#374151',
    border: '#D1D5DB',
  },
  ghost: {
    bg: 'transparent',
    bgHover: '#F3F4F6',
    text: '#374151',
  },
  danger: {
    bg: '#DC2626',
    bgHover: '#B91C1C',
    text: '#FFFFFF',
  },
};

const sizes = {
  xs: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 },
  sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
  md: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
  lg: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 16 },
  xl: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
};

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      style,
      textStyle,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantColors = colors[variant];
    const sizeConfig = sizes[size];
    const isDisabled = disabled || isLoading;

    return (
      <Pressable
        ref={ref}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? variantColors.bgHover : variantColors.bg,
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            ...(variant === 'outline' && {
              borderWidth: 1,
              borderColor: colors.outline.border,
            }),
            ...(isDisabled && styles.disabled),
          },
          style,
        ]}
        {...props}
      >
        <View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator color={variantColors.text} size="small" />
          ) : (
            leftIcon
          )}
          {typeof children === 'string' ? (
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
          ) : (
            children
          )}
          {rightIcon}
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});

Button.displayName = 'Button';
