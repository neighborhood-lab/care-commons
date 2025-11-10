/**
 * Profile Screen
 * Placeholder for future implementation
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/index';
import { createAuthService } from '../../services/auth';

export function ProfileScreen() {
  const handleLogout = async () => {
    const authService = createAuthService();
    await authService.logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen - Coming Soon</Text>
      <Button variant="danger" size="lg" onPress={handleLogout} style={styles.button}>
        Logout
      </Button>
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
    marginBottom: 24,
  },
  button: {
    minWidth: 200,
  },
});
