import React, { useState } from 'react';
import { X, FileText, Tag } from 'lucide-react';
import { Button, Card, CardHeader, CardContent, FormField, Select, LoadingSpinner } from '@/core/components';
import { formatDate } from '@/core/utils';
import type { ProgressNote, ProgressNoteType } from '../types';
import { useTranslation } from 'react-i18next';

export interface ProgressNoteFormProps {
  carePlanId: string;
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ProgressNote, 'id' | 'carePlanId' | 'clientId' | 'authorId' | 'authorName' | 'authorRole' | 'noteDate' | 'createdAt' | 'updatedAt' | 'reviewedBy' | 'reviewedAt' | 'approved'>) => void;
  isLoading?: boolean;
  authorInfo: {
    id: string;
    name: string;
    role: string;
  };
}

export const ProgressNoteForm: React.FC<ProgressNoteFormProps> = ({
  carePlanId,
  clientId,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  authorInfo,
}) => {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [noteType, setNoteType] = useState<ProgressNoteType>('VISIT_NOTE');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const noteTypeOptions = [
    { value: 'VISIT_NOTE', label: t('carePlans.visitNote') },
    { value: 'WEEKLY_SUMMARY', label: t('carePlans.weeklySummary') },
    { value: 'MONTHLY_SUMMARY', label: t('carePlans.monthlySummary') },
    { value: 'CARE_PLAN_REVIEW', label: t('carePlans.carePlanReview') },
    { value: 'INCIDENT', label: t('carePlans.incident') },
    { value: 'CHANGE_IN_CONDITION', label: t('carePlans.changeInCondition') },
    { value: 'COMMUNICATION', label: t('carePlans.communication') },
    { value: 'OTHER', label: t('carePlans.other') },
  ];

  const commonTags = [
    'Positive Progress',
    'Concern',
    'Medication',
    'Mobility',
    'Nutrition',
    'Hygiene',
    'Social',
    'Emotional',
    'Cognitive',
    'Pain',
    'Safety',
    'Family',
    'Follow-up Required',
  ];

  const handleFormSubmit = () => {
    if (!content.trim()) return;
    
    onSubmit({
      noteType,
      content,
      tags: selectedTags,
      isPrivate,
    });
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const addCustomTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{t('progressNotes.addNote')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            leftIcon={<X className="h-4 w-4" />}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Author Information */}
          <Card>
            <CardHeader title={t('progressNotes.authorInformation')} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('progressNotes.authorName')}</span>
                  <p className="mt-1 text-sm text-gray-900">{authorInfo.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('progressNotes.authorRole')}</span>
                  <p className="mt-1 text-sm text-gray-900">{authorInfo.role}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t('carePlans.noteDate')}</span>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(new Date())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note Type */}
          <FormField
            label={t('carePlans.noteType')}
            required
          >
            <Select
              options={noteTypeOptions}
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as ProgressNoteType)}
            />
          </FormField>

          {/* Content */}
          <FormField
            label={t('carePlans.noteContent')}
            required
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('progressNotes.enterNoteContent')}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          {/* Tags */}
          <Card>
            <CardHeader title={t('carePlans.tags')} />
            <CardContent>
              <div className="space-y-4">
                {/* Common Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('progressNotes.commonTags')}</label>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Tag */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('progressNotes.customTags')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                      placeholder={t('progressNotes.addTags')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCustomTag}
                      leftIcon={<Tag className="h-4 w-4" />}
                    >
                      {t('common.create')}
                    </Button>
                  </div>
                </div>

                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('carePlans.tags')}</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-300"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <FormField
            label={t('progressNotes.privateNote')}
          >
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  {t('progressNotes.markAsPrivate')}
                </span>
              </label>
            </div>
          </FormField>

          {/* Context Information */}
          <Card>
            <CardHeader title={t('common.info')} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">{t('carePlans.carePlan')} ID:</span>
                  <p className="mt-1 text-gray-900">{carePlanId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">{t('clients.client')} ID:</span>
                  <p className="mt-1 text-gray-900">{clientId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={isLoading || !content.trim()}
            leftIcon={isLoading ? <LoadingSpinner size="sm" /> : <FileText className="h-4 w-4" />}
          >
            {t('progressNotes.saveNote')}
          </Button>
        </div>
      </div>
    </div>
  );
};