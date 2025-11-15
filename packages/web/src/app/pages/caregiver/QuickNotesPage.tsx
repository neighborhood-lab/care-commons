/**
 * Quick notes page with voice dictation support
 *
 * Features:
 * - Voice-to-text dictation
 * - Large text area for mobile typing
 * - Quick note templates
 * - Save and submit functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useIsMobile } from '@/core/hooks';
import { Card, Button, Input } from '@/core/components';
import {
  Mic,
  MicOff,
  Save,
  Send,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';

interface Note {
  id: string;
  content: string;
  timestamp: Date;
  category: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  }
}

export const QuickNotesPage: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [noteContent, setNoteContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setNoteContent((prev) => prev + finalTranscript);
          setTranscript('');
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handleSave();
    navigate(`/caregiver/checkin/${visitId}`);
  };

  const insertTemplate = (template: string) => {
    setNoteContent((prev) => (prev ? prev + '\n\n' + template : template));
    textareaRef.current?.focus();
  };

  const quickTemplates = [
    {
      id: '1',
      label: 'Client Well',
      content: 'Client appeared in good spirits and health. No concerns to report.',
    },
    {
      id: '2',
      label: 'Medication',
      content: 'Medication administered as scheduled. Client tolerated well.',
    },
    {
      id: '3',
      label: 'Meal',
      content: 'Client ate well and stayed hydrated throughout visit.',
    },
    {
      id: '4',
      label: 'Activity',
      content: 'Client participated in scheduled activities. Good engagement.',
    },
  ];

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'health', label: 'Health' },
    { value: 'behavior', label: 'Behavior' },
    { value: 'medication', label: 'Medication' },
    { value: 'safety', label: 'Safety' },
  ];

  return (
    <div className={`space-y-${isMobile ? '4' : '6'} ${isMobile ? 'pb-6' : ''}`}>
      {/* Header */}
      <div>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
          Visit Notes
        </h1>
        <p className="text-gray-600 mt-1">Add notes about this visit</p>
      </div>

      {/* Voice Dictation Status */}
      {isListening && (
        <Card padding="md" className="bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="relative">
                <Mic className="h-6 w-6 text-red-600" />
                <div className="absolute inset-0 animate-ping">
                  <Mic className="h-6 w-6 text-red-600 opacity-75" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-900">Recording...</p>
              {transcript && (
                <p className="text-sm text-red-700 italic mt-1">{transcript}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Quick Templates */}
      <Card padding="md">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Templates
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size={isMobile ? 'md' : 'sm'}
                onClick={() => insertTemplate(template.content)}
                className={`text-left justify-start ${isMobile ? 'min-h-[44px]' : ''}`}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Note Category */}
      <Card padding="md">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Note Category
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              isMobile ? 'text-base min-h-[44px]' : 'text-sm'
            }`}
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {/* Note Content */}
      <Card padding="md">
        <div className="space-y-3">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Note Content
            </span>
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Type your notes here or use voice dictation..."
              rows={isMobile ? 8 : 6}
              className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                isMobile ? 'text-base' : 'text-sm'
              }`}
            />
          </label>

          {/* Character Count */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{noteContent.length} characters</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {/* Voice Dictation Button */}
        {speechSupported && (
          <Button
            variant={isListening ? 'danger' : 'outline'}
            size="lg"
            onClick={toggleListening}
            className={`w-full ${isMobile ? 'min-h-[56px]' : 'min-h-[48px]'} font-semibold`}
          >
            {isListening ? (
              <>
                <MicOff className="h-6 w-6" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-6 w-6" />
                Start Voice Dictation
              </>
            )}
          </Button>
        )}

        {!speechSupported && isMobile && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Voice dictation is not supported on this device or browser.
            </p>
          </div>
        )}

        {/* Save and Submit Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSave}
            disabled={!noteContent.trim() || isSaving}
            isLoading={isSaving}
            className={`flex-1 ${isMobile ? 'min-h-[48px]' : ''}`}
          >
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!noteContent.trim() || isSaving}
            className={`flex-1 ${isMobile ? 'min-h-[48px]' : ''} font-semibold`}
          >
            <Send className="h-5 w-5" />
            Submit & Return
          </Button>
        </div>
      </div>
    </div>
  );
};
