import React, { useState } from 'react';
import { X, CheckCircle, Camera, MapPin, Clock } from 'lucide-react';
import { Button, Card, CardHeader, CardContent, FormField, LoadingSpinner } from '@/core/components';
import { formatDate, formatTime } from '@/core/utils';
import { useCompleteTask } from '../hooks';
import type { TaskInstance, CompleteTaskInput } from '../types';

export interface TaskCompletionModalProps {
  task: TaskInstance;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [completionNote, setCompletionNote] = useState('');
  const [signatureData, setSignatureData] = useState<string>('');
  const [photoData, setPhotoData] = useState<string[]>([]);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const completeTask = useCompleteTask();

  const handleComplete = async () => {
    try {
      const input: CompleteTaskInput = {
        completionNote: completionNote || 'Task completed successfully',
        customFieldValues: {
          signature: signatureData,
          photos: photoData,
          observations,
          gpsLocation,
        },
      };

      await completeTask.mutateAsync({ id: task.id, input });
      onComplete?.();
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handlePhotoCapture = () => {
    // Placeholder for photo capture functionality
    // In a real implementation, this would integrate with device camera
    const mockPhoto = `data:image/jpeg;base64,mock-photo-${Date.now()}`;
    setPhotoData([...photoData, mockPhoto]);
  };

  const handleSignatureCapture = () => {
    // Placeholder for signature capture functionality
    // In a real implementation, this would use react-signature-canvas
    const mockSignature = `data:image/png;base64,mock-signature-${Date.now()}`;
    setSignatureData(mockSignature);
  };

  const requestGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('GPS location error:', error);
        }
      );
    }
  };

  const handleObservationChange = (key: string, value: string) => {
    setObservations({ ...observations, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Complete Task</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            leftIcon={<X className="h-4 w-4" />}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Task Information */}
          <Card>
            <CardHeader title="Task Details" />
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">{task.name}</span>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(task.scheduledDate)} {task.scheduledTime && formatTime(task.scheduledTime)}
                  </span>
                  <span>{task.category.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Note */}
          <FormField
            label="Completion Note"
            required
          >
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="Describe how the task was completed..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          {/* Signature Capture */}
          {task.requiredSignature && (
            <Card>
              <CardHeader title="Signature Required" />
              <CardContent>
                <div className="space-y-4">
                  {signatureData ? (
                    <div className="border-2 border-gray-300 rounded-md p-4">
                      <img src={signatureData} alt="Signature" className="max-h-32 mx-auto" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSignatureData('')}
                        className="mt-2"
                      >
                        Clear Signature
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Client signature required</p>
                      <Button onClick={handleSignatureCapture}>
                        Capture Signature
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Capture */}
          <Card>
            <CardHeader title="Photos (Optional)" />
            <CardContent>
              <div className="space-y-4">
                {photoData.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {photoData.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Task photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPhotoData(photoData.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={handlePhotoCapture}
                  leftIcon={<Camera className="h-4 w-4" />}
                >
                  Add Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* GPS Verification */}
          <Card>
            <CardHeader title="Location Verification" />
            <CardContent>
              <div className="space-y-4">
                {gpsLocation ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <MapPin className="h-4 w-4" />
                    Location verified: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={requestGPSLocation}
                    leftIcon={<MapPin className="h-4 w-4" />}
                  >
                    Verify Location
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader title="Observations" />
            <CardContent>
              <div className="space-y-4">
                <FormField label="Client Condition">
                  <textarea
                    value={observations.clientCondition || ''}
                    onChange={(e) => handleObservationChange('clientCondition', e.target.value)}
                    placeholder="Describe client's condition during task..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>

                <FormField label="Issues or Concerns">
                  <textarea
                    value={observations.concerns || ''}
                    onChange={(e) => handleObservationChange('concerns', e.target.value)}
                    placeholder="Any issues or concerns noted..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>

                <FormField label="Additional Notes">
                  <textarea
                    value={observations.additionalNotes || ''}
                    onChange={(e) => handleObservationChange('additionalNotes', e.target.value)}
                    placeholder="Any additional observations..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={completeTask.isPending || (task.requiredSignature && !signatureData)}
            leftIcon={completeTask.isPending ? <LoadingSpinner size="sm" /> : <CheckCircle className="h-4 w-4" />}
          >
            Complete Task
          </Button>
        </div>
      </div>
    </div>
  );
};