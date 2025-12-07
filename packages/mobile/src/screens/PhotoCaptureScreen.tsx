/**
 * Photo Capture Screen for Care Documentation
 *
 * Enables caregivers to document care activities with photos:
 * - Wound care progression
 * - Meals prepared
 * - Medication administration
 * - Home safety conditions
 * - Client wellbeing
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface PhotoData {
  uri: string;
  caption: string;
  timestamp: string;
  taskId: string;
  taskName: string;
}

export default function PhotoCaptureScreen({ route, navigation }: any) {
  const { taskId, taskName, visitId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View style={styles.container}><Text>Loading camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            Folk Care needs camera access to document care activities with photos.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Compress and resize photo
      const manipulatedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCapturedPhoto(manipulatedPhoto.uri);
      setShowCamera(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      console.error('Photo capture error:', error);
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;

    try {
      // Create photos directory if it doesn't exist
      // Use cacheDirectory for temporary storage (will be synced to backend)
      const photosDir = `${FileSystem.cacheDirectory}photos/`;
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      // Generate unique filename
      const timestamp = new Date().toISOString();
      const filename = `${visitId}_${taskId}_${Date.now()}.jpg`;
      const newUri = `${photosDir}${filename}`;

      // Move photo to permanent storage
      await FileSystem.moveAsync({
        from: capturedPhoto,
        to: newUri,
      });

      const photoData: PhotoData = {
        uri: newUri,
        caption,
        timestamp,
        taskId,
        taskName,
      };

      setPhotos([...photos, photoData]);
      setCapturedPhoto(null);
      setCaption('');

      Alert.alert('Success', 'Photo saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo. Please try again.');
      console.error('Photo save error:', error);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setShowCamera(true);
  };

  const deletePhoto = (index: number) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const photoToDelete = photos[index];
            try {
              // Delete physical file
              await FileSystem.deleteAsync(photoToDelete.uri, { idempotent: true });
              // Remove from state
              setPhotos(photos.filter((_, i) => i !== index));
            } catch (error) {
              console.error('Photo deletion error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDone = () => {
    navigation.navigate('VisitDetails', {
      visitId,
      photos: photos.length,
    });
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>

            <View style={styles.cameraBottomControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: capturedPhoto }}
              style={styles.previewImage}
              resizeMode="contain"
            />

            <View style={styles.captionCard}>
              <Text style={styles.captionLabel}>Add Caption (Optional)</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Describe what this photo shows..."
                multiline
                numberOfLines={3}
                value={caption}
                onChangeText={setCaption}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.retakeButton]}
                onPress={retakePhoto}
              >
                <Text style={styles.actionButtonText}>📷 Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={savePhoto}
              >
                <Text style={styles.actionButtonTextPrimary}>✓ Save Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Documentation</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Task Info */}
        <View style={styles.card}>
          <Text style={styles.taskTitle}>Task: {taskName}</Text>
          <Text style={styles.taskHint}>
            Document care activities with photos for quality assurance and compliance.
          </Text>
        </View>

        {/* Take Photo Button */}
        <TouchableOpacity
          style={styles.takePhotoButton}
          onPress={() => setShowCamera(true)}
        >
          <Text style={styles.takePhotoIcon}>📷</Text>
          <Text style={styles.takePhotoText}>Take Photo</Text>
        </TouchableOpacity>

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.galleryTitle}>
              Captured Photos ({photos.length})
            </Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.thumbnail}
                  />
                  {photo.caption && (
                    <Text style={styles.photoCaption} numberOfLines={2}>
                      {photo.caption}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={() => deletePhoto(index)}
                  >
                    <Text style={styles.deletePhotoText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Photo Documentation Tips</Text>
          <Text style={styles.infoItem}>• Take clear, well-lit photos</Text>
          <Text style={styles.infoItem}>• Avoid including faces for privacy</Text>
          <Text style={styles.infoItem}>• Add captions to describe context</Text>
          <Text style={styles.infoItem}>• Photos sync automatically after clock-out</Text>
          <Text style={styles.infoItem}>• Photos are encrypted for HIPAA compliance</Text>
        </View>

        {/* Done Button */}
        {photos.length > 0 && (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>
              Done ({photos.length} photo{photos.length !== 1 ? 's' : ''})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  taskHint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  takePhotoButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  takePhotoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  takePhotoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: (Dimensions.get('window').width - 64) / 2,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  photoCaption: {
    padding: 8,
    fontSize: 12,
    color: '#666',
  },
  deletePhotoButton: {
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deletePhotoText: {
    fontSize: 12,
    color: '#E53935',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
  captionCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    backgroundColor: '#FAFAFA',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retakeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
