import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components';
import { useEVVRecord } from '../hooks';

export const EVVRecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: record, isLoading, error } = useEVVRecord(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !record) {
    return (
      <ErrorMessage
        message="Failed to load EVV record"
        action={
          <Button onClick={() => navigate('/time-tracking')}>
            Back to List
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/time-tracking')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">EVV Record Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Visit ID</h3>
            <p className="text-lg font-semibold">{record.visitId}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <p className="text-lg font-semibold">{record.status.replace('_', ' ')}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Clock In</h3>
            <p className="text-lg">{new Date(record.clockInTime).toLocaleString()}</p>
          </div>

          {record.clockOutTime && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Clock Out</h3>
              <p className="text-lg">{new Date(record.clockOutTime).toLocaleString()}</p>
            </div>
          )}

          {record.totalMinutes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Duration</h3>
              <p className="text-lg font-semibold">{record.totalMinutes} minutes</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Verification Method</h3>
            <p className="text-lg">{record.verificationMethod}</p>
          </div>
        </div>

        {record.gpsCoordinates && (
          <div className="pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              GPS Coordinates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Latitude:</span>
                <p className="font-mono">{record.gpsCoordinates.latitude}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Longitude:</span>
                <p className="font-mono">{record.gpsCoordinates.longitude}</p>
              </div>
            </div>
          </div>
        )}

        {record.notes && (
          <div className="pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p className="text-gray-700">{record.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
