/**
 * Coming Soon Screen
 *
 * Placeholder screen for verticals that are not yet implemented
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type Props = NativeStackScreenProps<RootStackParamList, 'ComingSoon'>;

export function ComingSoonScreen({ route, navigation }: Props) {
  const { verticalName, verticalDescription } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={styles.title}>{verticalName}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>{verticalDescription}</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            This feature is currently under development and will be available in a future release.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#F59E0B',
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
