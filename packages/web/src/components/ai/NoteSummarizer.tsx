/**
 * Note Summarizer Component
 *
 * AI-powered note summarization widget that can be embedded in any note display.
 * Uses Claude API to generate intelligent summaries of caregiver notes.
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface NoteSummarizerProps {
  noteId: string;
  noteType: 'PROGRESS_NOTE' | 'VISIT_NOTE' | 'INCIDENT_REPORT' | 'CARE_PLAN_UPDATE' | 'ASSESSMENT' | 'GENERAL';
  content: string;
  defaultStrategy?: 'BRIEF' | 'STANDARD' | 'DETAILED' | 'BULLET_POINTS';
}

export interface SummarizedNote {
  noteId: string;
  noteType: string;
  summary: string;
  summaryLength: number;
  originalLength: number;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'CONCERNING' | 'CRITICAL';
  sentimentScore?: number;
  keywords?: string[];
  processingTimeMs: number;
}

/**
 * Note Summarizer Component
 */
export const NoteSummarizer: React.FC<NoteSummarizerProps> = ({
  noteId,
  noteType,
  content,
  defaultStrategy = 'STANDARD',
}) => {
  const [strategy, setStrategy] = useState<'BRIEF' | 'STANDARD' | 'DETAILED' | 'BULLET_POINTS'>(defaultStrategy);
  const [showSentiment, setShowSentiment] = useState(true);
  const [showKeywords, setShowKeywords] = useState(true);
  const [summary, setSummary] = useState<SummarizedNote | null>(null);

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/summarize-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          noteId,
          noteType,
          content,
          strategy,
          includeSentiment: showSentiment,
          includeKeywords: showKeywords,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize note');
      }

      const result = await response.json();
      return result.data as SummarizedNote;
    },
    onSuccess: (data) => {
      setSummary(data);
      toast.success('Summary generated successfully!');
    },
    onError: (error) => {
      console.error('Summarization error:', error);
      toast.error('Failed to generate summary. Please try again.');
    },
  });

  const handleSummarize = () => {
    summarizeMutation.mutate();
  };

  const compressionRatio = summary
    ? Math.round(((summary.originalLength - summary.summaryLength) / summary.originalLength) * 100)
    : 0;

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'NEUTRAL':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      case 'CONCERNING':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'CRITICAL':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">AI Summary</h3>
        </div>
        <span className="text-xs text-gray-500">Powered by Claude</span>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-4">
        {/* Strategy Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Summary Length</label>
          <div className="grid grid-cols-4 gap-2">
            {['BRIEF', 'STANDARD', 'DETAILED', 'BULLET_POINTS'].map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s as any)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  strategy === s
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                }`}
              >
                {s === 'BULLET_POINTS' ? 'Bullets' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={showSentiment}
              onChange={(e) => setShowSentiment(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Include sentiment
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={showKeywords}
              onChange={(e) => setShowKeywords(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            Extract keywords
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSummarize}
          disabled={summarizeMutation.isPending}
          className="w-full px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {summarizeMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Summary...
            </span>
          ) : (
            'Generate AI Summary'
          )}
        </button>
      </div>

      {/* Summary Output */}
      {summary && (
        <div className="border-t border-gray-200 pt-4 space-y-3">
          {/* Sentiment Badge */}
          {summary.sentiment && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getSentimentColor(summary.sentiment)}`}>
              <span className="w-2 h-2 rounded-full bg-current"></span>
              {summary.sentiment.charAt(0) + summary.sentiment.slice(1).toLowerCase()}
              {summary.sentimentScore !== undefined && ` (${summary.sentimentScore}/100)`}
            </div>
          )}

          {/* Summary Text */}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{summary.summary}</p>
          </div>

          {/* Keywords */}
          {summary.keywords && summary.keywords.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {summary.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {compressionRatio}% shorter · {(summary.processingTimeMs / 1000).toFixed(2)}s
            </span>
            <span>{summary.summaryLength} chars (from {summary.originalLength})</span>
          </div>
        </div>
      )}
    </div>
  );
};
