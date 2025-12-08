/**
 * Voice Note Recorder Component (Web)
 *
 * WORKER-FIRST: Voice notes are 3x faster than typing.
 * Works in web browsers for coordinators documenting visits or nurses
 * doing remote documentation.
 *
 * Features:
 * - Browser-based audio recording (MediaRecorder API)
 * - Visual feedback during recording
 * - Preview transcription before submitting
 * - FREE transcription via Cloudflare Workers AI or Groq
 */

import { useState, useRef, useEffect } from 'react';

interface VoiceNoteRecorderProps {
  onTranscriptionComplete: (transcription: string, audioBlob: Blob) => void;
  onCancel?: () => void;
  maxDurationSeconds?: number; // Default: 300 (5 minutes)
}

export function VoiceNoteRecorder({
  onTranscriptionComplete,
  onCancel,
  maxDurationSeconds = 300,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Pulse animation
  useEffect(() => {
    setIsPulsing(isRecording);
  }, [isRecording]);

  // Duration counter
  useEffect(() => {
    if (isRecording) {
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDurationSeconds) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      setRecordingDuration(0);
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isRecording, maxDurationSeconds]);

  async function startRecording() {
    try {
      setErrorMessage(null);
      audioChunks.current = [];

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Your browser does not support audio recording');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage('Failed to access microphone. Please check permissions.');
    }
  }

  async function stopRecording() {
    if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') return;

    setIsRecording(false);
    mediaRecorder.current.stop();
  }

  async function transcribeAudio(audioBlob: Blob) {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      // Phase 2: Replace with actual API call to backend
      // For now, simulate transcription with mock data
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockTranscription =
        "Assisted client with morning routine. Helped with bathing and dressing. " +
        "Client was in good mood and ate a full breakfast. Blood pressure 120 over 80, " +
        "heart rate 72. Administered Lisinopril 10 milligrams and Metformin 500 milligrams. " +
        "Client mentioned some knee pain, recommend follow up with orthopedist.";

      onTranscriptionComplete(mockTranscription, audioBlob);
    } catch (error) {
      console.error('Transcription failed:', error);
      setErrorMessage('Transcription failed. Please try again or type manually.');
    } finally {
      setIsTranscribing(false);
    }
  }

  function cancelRecording() {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (onCancel) {
      onCancel();
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (isTranscribing) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-semibold text-gray-900 mb-2">Transcribing voice note...</p>
        <p className="text-sm text-gray-600">Using FREE AI to convert your speech to text</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 w-full max-w-md">
          <p className="text-sm text-red-800 text-center">{errorMessage}</p>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex flex-col items-center mb-8">
          <div className="w-3 h-3 bg-red-600 rounded-full mb-2 animate-pulse"></div>
          <p className="text-lg font-semibold text-red-600 mb-1">Recording</p>
          <p className="text-3xl font-bold text-gray-900 font-mono">
            {formatDuration(recordingDuration)}
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && (
        <div className="text-center mb-12 max-w-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Voice Note</h3>
          <p className="text-gray-600 mb-2">
            Speak naturally about the care you provided. Include activities, client mood,
            vitals, medications, and any concerns.
          </p>
          <p className="text-sm text-blue-600 font-medium">
            Free transcription • Works in browser • 3x faster than typing
          </p>
        </div>
      )}

      {/* Record Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`
          relative w-32 h-32 rounded-full flex items-center justify-center
          transition-all duration-300 mb-8
          ${isRecording
            ? 'bg-red-50 hover:bg-red-100'
            : 'bg-gray-100 hover:bg-gray-200'
          }
          shadow-lg hover:shadow-xl
        `}
      >
        <div
          className={`
            w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isRecording ? 'bg-red-600' : 'bg-blue-600'}
            ${isPulsing ? 'animate-pulse' : ''}
          `}
        >
          {isRecording ? (
            <div className="w-8 h-8 bg-white rounded"></div>
          ) : (
            <span className="text-5xl">🎙️</span>
          )}
        </div>
      </button>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-12">
        <button
          onClick={isRecording ? cancelRecording : onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700"
        >
          {isRecording ? 'Cancel' : 'Close'}
        </button>
      </div>

      {/* Tips */}
      {!isRecording && (
        <div className="bg-gray-50 rounded-lg p-6 max-w-md">
          <p className="text-sm font-semibold text-gray-900 mb-3">Tips for best results:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Speak clearly in a quiet environment</li>
            <li>• Say numbers as "one hundred twenty over eighty"</li>
            <li>• Spell medication names if unsure</li>
            <li>• Mention client name for clarity</li>
          </ul>
        </div>
      )}

      {/* Max Duration Warning */}
      {isRecording && recordingDuration > maxDurationSeconds * 0.8 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md">
          <p className="text-sm text-yellow-800 text-center">
            ⚠️ Recording will auto-stop at {Math.floor(maxDurationSeconds / 60)} minutes
          </p>
        </div>
      )}
    </div>
  );
}
