/**
 * Voice-to-Text Service
 *
 * Handles voice recognition for visit notes documentation
 * Uses Expo Speech Recognition for real-time transcription
 */

import * as Speech from 'expo-speech';
import { Alert, Platform } from 'react-native';
import type { Database } from '@nozbe/watermelondb';
import type { VisitNote } from '../database/models/VisitNote.js';

export interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  maxDuration?: number; // in milliseconds
}

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface SaveVoiceNoteOptions {
  visitId: string;
  evvRecordId?: string;
  organizationId: string;
  caregiverId: string;
  noteType: 'GENERAL' | 'CLINICAL' | 'INCIDENT' | 'TASK';
  text: string;
  confidence?: number;
  audioFileUri?: string;
}

export class VoiceService {
  private isRecording = false;
  private recognizedText = '';

  constructor(private database: Database) {}

  /**
   * Check if speech recognition is available
   */
  async isAvailable(): Promise<boolean> {
    // Expo Speech doesn't have built-in recognition, we'll use native APIs
    // This is a placeholder - you'd use expo-speech-recognition or react-native-voice
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Start voice recognition
   *
   * Note: This is a simplified implementation. In production, you would use:
   * - expo-speech-recognition (if available)
   * - react-native-voice
   * - Or integrate with cloud services like Google Speech-to-Text or Azure Speech
   */
  async startRecognition(
    _options: VoiceRecognitionOptions = {},
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Speech recognition not available on this device');
      }

      if (this.isRecording) {
        throw new Error('Already recording');
      }

      this.isRecording = true;
      this.recognizedText = '';

      // Prevent unused variable warning
      void onResult;

      // TODO: Implement actual speech recognition
      // For now, this is a placeholder that would integrate with:
      // 1. expo-speech-recognition (when available)
      // 2. react-native-voice
      // 3. Cloud-based services (Google, Azure, AWS)

      // Example usage with react-native-voice:
      /*
      Voice.onSpeechResults = (e) => {
        if (e.value && e.value.length > 0) {
          const text = e.value[0];
          this.recognizedText = text;
          onResult({
            text,
            confidence: 0.9, // Voice API provides this
            isFinal: true,
          });
        }
      };

      Voice.onSpeechError = (e) => {
        if (onError) {
          onError(new Error(e.error?.message || 'Speech recognition error'));
        }
      };

      await Voice.start(options.language || 'en-US');
      */

      Alert.alert(
        'Voice Recognition',
        'Speech-to-text is not yet implemented. This would integrate with expo-speech-recognition or react-native-voice in production.',
        [
          {
            text: 'OK',
            onPress: () => {
              this.isRecording = false;
            },
          },
        ]
      );
    } catch (error) {
      this.isRecording = false;
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown error'));
      } else {
        throw error;
      }
    }
  }

  /**
   * Stop voice recognition
   */
  async stopRecognition(): Promise<string> {
    if (!this.isRecording) {
      return this.recognizedText;
    }

    try {
      // TODO: Stop the actual speech recognition
      // await Voice.stop();

      this.isRecording = false;
      return this.recognizedText;
    } catch (error) {
      console.error('Stop recognition error:', error);
      this.isRecording = false;
      return this.recognizedText;
    }
  }

  /**
   * Cancel voice recognition
   */
  async cancelRecognition(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      // TODO: Cancel the actual speech recognition
      // await Voice.cancel();

      this.isRecording = false;
      this.recognizedText = '';
    } catch (error) {
      console.error('Cancel recognition error:', error);
      this.isRecording = false;
    }
  }

  /**
   * Save voice note to database
   */
  async saveVoiceNote(options: SaveVoiceNoteOptions): Promise<VisitNote> {
    const {
      visitId,
      evvRecordId,
      organizationId,
      caregiverId,
      noteType,
      text,
      confidence,
      audioFileUri,
    } = options;

    const note = await this.database.write(async () => {
      const newNote = await this.database
        .get<VisitNote>('visit_notes')
        .create((record) => {
          record.visitId = visitId;
          if (evvRecordId) record.evvRecordId = evvRecordId;
          record.organizationId = organizationId;
          record.caregiverId = caregiverId;
          record.noteType = noteType;
          record.noteText = text;
          record.isVoiceNote = true;
          if (audioFileUri) record.audioFileUri = audioFileUri;
          if (confidence !== undefined) {
            record.transcriptionConfidence = confidence;
          }
          record.isSynced = false;
          record.syncPending = true;
        });

      return newNote;
    });

    return note;
  }

  /**
   * Text-to-speech - Read text aloud
   * Useful for reading back notes to caregivers
   */
  async speakText(
    text: string,
    options: {
      language?: string;
      pitch?: number;
      rate?: number;
    } = {}
  ): Promise<void> {
    try {
      await Speech.speak(text, {
        language: options.language || 'en-US',
        pitch: options.pitch || 1.0,
        rate: options.rate || 1.0,
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }

  /**
   * Stop speaking
   */
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Stop speaking error:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}
