/**
 * Platform-agnostic Input Component (React Native)
 */

import React from 'react';
import { View, TextInput, Text, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import type { Size } from '../types/ui.js';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

const sizes = {
  xs: { fontSize: 12, paddingVertical: 4, paddingHorizontal: 8 },
  sm: { fontSize: 14, paddingVertical: 6, paddingHorizontal: 12 },
  md: { fontSize: 14, paddingVertical: 8, paddingHorizontal: 16 },
  lg: { fontSize: 16, paddingVertical: 10, paddingHorizontal: 20 },
  xl: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 24 },
};

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      leftIcon,
      rightIcon,
      style,
      containerStyle,
      ...props
    },
    ref
  ) => {
    const sizeConfig = sizes[size];

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            error ? styles.inputContainerError : undefined,
          ]}
        >
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                fontSize: sizeConfig.fontSize,
                paddingVertical: sizeConfig.paddingVertical,
                paddingHorizontal: sizeConfig.paddingHorizontal,
              },
              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightIcon ? styles.inputWithRightIcon : undefined,
              style,
            ]}
            placeholderTextColor="#9CA3AF"
            accessibilityLabel={label}
            {...props}
          />
          {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </View>
        {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        {helperText && !error && <Text style={styles.helper}>{helperText}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: '#DC2626',
  },
  input: {
    flex: 1,
    color: '#111827',
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  icon: {
    paddingHorizontal: 12,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: '#DC2626',
  },
  helper: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
});

Input.displayName = 'Input';
