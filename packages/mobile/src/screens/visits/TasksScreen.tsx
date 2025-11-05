/**
 * Tasks Screen
 * Placeholder - will show tasks for a visit
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type Props = NativeStackScreenProps<RootStackParamList, 'Tasks'>;

export function TasksScreen({ route }: Props) {
  const { visitId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tasks for visit {visitId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 16,
    color: '#6B7280',
  },
});
