/**
 * Photo Gallery Screen
 *
 * Displays and manages photos attached to a visit
 * Allows adding photos from camera or gallery
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/index.js';
import { PhotoService } from '../../services/photo.service.js';
import { database } from '../../database/index.js';
import type { VisitAttachment } from '../../database/models/VisitAttachment.js';
import type { RootStackParamList } from '../../navigation/RootNavigator.js';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoGallery'>;

export function PhotoGalleryScreen({ route }: Props) {
  const { visitId, organizationId, caregiverId, category = 'GENERAL' } = route.params;

  const [photos, setPhotos] = useState<VisitAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const photoService = new PhotoService(database);

  /**
   * Load photos for this visit
   */
  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const visitPhotos = await photoService.getVisitAttachments(visitId);
      setPhotos(visitPhotos);
    } catch (error) {
      console.error('Load photos error:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitId]);

  /**
   * Handle taking a photo with camera
   */
  const handleTakePhoto = async () => {
    try {
      const asset = await photoService.capturePhoto();
      if (!asset) return;

      setIsUploading(true);

      await photoService.savePhotoAttachment(asset, {
        visitId,
        organizationId,
        caregiverId,
        category,
        compress: true,
      });

      await loadPhotos();
      Alert.alert('Success', 'Photo added successfully');
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('Error', 'Failed to add photo');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle selecting photo from gallery
   */
  const handleSelectFromGallery = async () => {
    try {
      const asset = await photoService.selectFromGallery();
      if (!asset) return;

      setIsUploading(true);

      await photoService.savePhotoAttachment(asset, {
        visitId,
        organizationId,
        caregiverId,
        category,
        compress: true,
      });

      await loadPhotos();
      Alert.alert('Success', 'Photo added successfully');
    } catch (error) {
      console.error('Select photo error:', error);
      Alert.alert('Error', 'Failed to add photo');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle deleting a photo
   */
  const handleDeletePhoto = (photo: VisitAttachment) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await photoService.deletePhotoAttachment(photo);
              await loadPhotos();
              Alert.alert('Success', 'Photo deleted');
            } catch (error) {
              console.error('Delete photo error:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  /**
   * Render photo item
   */
  const renderPhoto = ({ item }: { item: VisitAttachment }) => (
    <Pressable
      style={styles.photoItem}
      onLongPress={() => handleDeletePhoto(item)}
    >
      <Image source={{ uri: item.fileUri }} style={styles.photo} />
      <View style={styles.photoInfo}>
        <Text style={styles.photoCaption} numberOfLines={1}>
          {item.caption || 'No caption'}
        </Text>
        <Text style={styles.photoStatus}>
          {item.uploadStatus === 'UPLOADED' && '✓ Uploaded'}
          {item.uploadStatus === 'PENDING' && '⏳ Pending'}
          {item.uploadStatus === 'UPLOADING' && '↑ Uploading...'}
          {item.uploadStatus === 'FAILED' && '✗ Failed'}
        </Text>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Photo Grid */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.photoGrid}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>
              Add photos to document this visit
            </Text>
          </View>
        }
      />

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          variant="secondary"
          onPress={handleSelectFromGallery}
          style={styles.footerButton}
          disabled={isUploading}
        >
          Choose from Gallery
        </Button>
        <Button
          variant="primary"
          onPress={handleTakePhoto}
          style={styles.footerButton}
          disabled={isUploading}
          loading={isUploading}
        >
          Take Photo
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  photoGrid: {
    padding: 8,
  },
  photoItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  photoInfo: {
    padding: 8,
  },
  photoCaption: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 4,
  },
  photoStatus: {
    fontSize: 10,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    flex: 1,
  },
});
