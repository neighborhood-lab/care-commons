import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QuickNotesPage } from '../QuickNotesPage';

// Mock hooks
vi.mock('@/core/hooks', () => ({
  useAuth: () => ({ user: { id: 'user-123', name: 'Test User' } }),
  useIsMobile: () => false,
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ visitId: 'visit-123' }),
  };
});

describe('QuickNotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Web Speech API as not supported by default
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('should render quick notes page', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Visit Notes')).toBeInTheDocument();
    expect(screen.getByText('Add notes about this visit')).toBeInTheDocument();
  });

  it('should display quick templates', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Quick Templates')).toBeInTheDocument();
    expect(screen.getByText('Client Well')).toBeInTheDocument();
    expect(screen.getByText('Medication')).toBeInTheDocument();
    expect(screen.getByText('Meal')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('should display note category selector', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Note Category')).toBeInTheDocument();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('should have text area for note content', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    expect(textarea).toBeInTheDocument();
  });

  it('should insert template on button click', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const clientWellButton = screen.getByText('Client Well');
    fireEvent.click(clientWellButton);

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    expect(textarea).toHaveValue('Client appeared in good spirits and health. No concerns to report.');
  });

  it('should append multiple templates with newlines', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const clientWellButton = screen.getByText('Client Well');
    const medicationButton = screen.getByText('Medication');

    fireEvent.click(clientWellButton);
    fireEvent.click(medicationButton);

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    expect(textarea.value).toContain('Client appeared in good spirits and health');
    expect(textarea.value).toContain('Medication administered as scheduled');
  });

  it('should update character count', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    fireEvent.change(textarea, { target: { value: 'Test note' } });

    expect(screen.getByText('9 characters')).toBeInTheDocument();
  });

  it('should change note category', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'health' } });

    expect(select).toHaveValue('health');
  });

  it('should disable save button when note is empty', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const saveButton = screen.getByText('Save Draft');
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when note has content', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    fireEvent.change(textarea, { target: { value: 'Test note' } });

    const saveButton = screen.getByText('Save Draft');
    expect(saveButton).toBeEnabled();
  });

  it('should save note and show saved state', async () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    fireEvent.change(textarea, { target: { value: 'Test note' } });

    const saveButton = screen.getByText('Save Draft');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('should navigate back on submit', async () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    fireEvent.change(textarea, { target: { value: 'Test note' } });

    const submitButton = screen.getByText('Submit & Return');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/caregiver/checkin/visit-123');
    });
  });

  it('should show voice dictation not supported message when unavailable', () => {
    vi.mocked(require('@/core/hooks').useIsMobile).mockReturnValue(true);

    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    expect(
      screen.getByText('Voice dictation is not supported on this device or browser.')
    ).toBeInTheDocument();
  });

  it('should initialize speech recognition when supported', () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: '',
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null,
    };

    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    expect(mockRecognition.continuous).toBe(true);
    expect(mockRecognition.interimResults).toBe(true);
    expect(mockRecognition.lang).toBe('en-US');
  });

  it('should start recording on voice button click', () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: '',
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null,
    };

    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const voiceButton = screen.getByText('Start Voice Dictation');
    fireEvent.click(voiceButton);

    expect(mockRecognition.start).toHaveBeenCalled();
    expect(screen.getByText('Recording...')).toBeInTheDocument();
  });

  it('should stop recording on voice button click when recording', () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: '',
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null,
    };

    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    // Start recording
    const voiceButton = screen.getByText('Start Voice Dictation');
    fireEvent.click(voiceButton);

    // Stop recording
    const stopButton = screen.getByText('Stop Recording');
    fireEvent.click(stopButton);

    expect(mockRecognition.stop).toHaveBeenCalled();
  });

  it('should handle speech recognition results', () => {
    const mockRecognition = {
      continuous: false,
      interimResults: false,
      lang: '',
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null,
    };

    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);

    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    // Simulate speech result
    if (mockRecognition.onresult) {
      mockRecognition.onresult({
        results: [
          {
            0: { transcript: 'Hello world', confidence: 0.9 },
            isFinal: true,
            length: 1,
          },
        ],
        resultIndex: 0,
      } as any);
    }

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    waitFor(() => {
      expect(textarea.value).toContain('Hello world');
    });
  });

  it('should display current time', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    // Should show time in HH:MM format
    const timeRegex = /\d{1,2}:\d{2}/;
    const timeElements = screen.getAllByText(timeRegex);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should trim whitespace from note content for validation', () => {
    render(
      <BrowserRouter>
        <QuickNotesPage />
      </BrowserRouter>
    );

    const textarea = screen.getByPlaceholderText('Type your notes here or use voice dictation...');
    fireEvent.change(textarea, { target: { value: '   ' } });

    const saveButton = screen.getByText('Save Draft');
    expect(saveButton).toBeDisabled();
  });
});
