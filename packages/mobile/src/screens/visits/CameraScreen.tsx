/**
 * Camera Screen for Photo Capture
 *
 * Full-featured camera screen for capturing photos during:
 * - Clock-in/out verification
 * - Task completion documentation
 * - Incident reporting
 *
 * Features:
 * - Front/back camera toggle
 * - Flash control
 * - Photo preview before submission
 * - Image compression for bandwidth optimization
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { Button } from '../../components/index.js';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

export function CameraScreen({ route, navigation }: Props) {
  const { onCapture } = route.params;

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  /**
   * Request camera permissions on mount
   */
  useEffect(() => {
    if (permission && !permission.granted) {
      void requestPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]);

  /**
   * Toggle camera facing (front/back)
   */
  const toggleCameraFacing = () => {
    setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  };

  /**
   * Toggle flash mode
   */
  const toggleFlash = () => {
    setFlash((current: FlashMode) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  /**
   * Capture photo
   */
  const capturePhoto = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7, // Compress to 70% quality
        base64: false,
        exif: false,
      });

      if (photo?.uri) {
        // Call the onCapture callback with the photo URI
        onCapture(photo.uri);

        // Navigate back
        navigation.goBack();
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Cancel and go back
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  // Handle permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
        <Button variant="primary" onPress={requestPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <Pressable style={styles.controlButton} onPress={toggleFlash}>
            <Text style={styles.controlIcon}>
              {flash === 'off' && '⚡️'}
              {flash === 'on' && '⚡'}
              {flash === 'auto' && '🔆'}
            </Text>
            <Text style={styles.controlText}>
              {flash.charAt(0).toUpperCase() + flash.slice(1)}
            </Text>
          </Pressable>

          <Pressable style={styles.controlButton} onPress={handleCancel}>
            <Text style={styles.controlIcon}>✕</Text>
          </Pressable>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.bottomRow}>
            {/* Flip Camera Button */}
            <Pressable
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.flipIcon}>🔄</Text>
            </Pressable>

            {/* Capture Button */}
            <Pressable
              style={styles.captureButton}
              onPress={capturePhoto}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </Pressable>

            {/* Spacer for layout balance */}
            <View style={styles.flipButton} />
          </View>

          <Text style={styles.hint}>Tap to capture photo</Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  controlIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  controlText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
