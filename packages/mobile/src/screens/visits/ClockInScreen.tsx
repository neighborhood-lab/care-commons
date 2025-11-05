/**
 * Clock In Screen
 * Placeholder - will be enhanced with GPS verification UI
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type Props = NativeStackScreenProps<RootStackParamList, 'ClockIn'>;

export function ClockInScreen({ route }: Props) {
  const { visitId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Clock In Screen for visit {visitId}</Text>
      <Text style={styles.subtext}>GPS verification UI will be added here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
