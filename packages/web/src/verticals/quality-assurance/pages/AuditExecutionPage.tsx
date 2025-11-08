/**
 * Audit Execution Page
 *
 * Page for executing audits with checklist items, recording findings,
 * and completing audits with executive summary and recommendations
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  FileCheck
} from 'lucide-react';
import { Button, Card, LoadingSpinner, TextArea, Badge } from '@/core/components';
import { useAuditDetail } from '../hooks';
import type { AuditChecklistItem, AuditChecklistSection } from '../types';

interface ChecklistResponse {
  sectionId: string;
  itemId: string;
  response: string;
  notes?: string;
}

export const AuditExecutionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: audit, isLoading, error } = useAuditDetail(id);

  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>({});
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load audit</p>
        {error && <p className="text-sm text-gray-600 mt-2">{(error as Error).message}</p>}
      </div>
    );
  }

  // Mock template with checklist sections
  const mockTemplate: { checklistSections: AuditChecklistSection[] } = {
    checklistSections: [
      {
        sectionId: 'section-1',
        title: 'Documentation Review',
        description: 'Review of required documentation',
        orderIndex: 1,
        items: [
          {
            itemId: 'item-1',
            question: 'Are all required forms completed and signed?',
            guidance: 'Check for completeness and signatures',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 1
          },
          {
            itemId: 'item-2',
            question: 'Are dates and times accurately recorded?',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2
          }
        ]
      },
      {
        sectionId: 'section-2',
        title: 'Compliance Check',
        description: 'Verify regulatory compliance',
        orderIndex: 2,
        items: [
          {
            itemId: 'item-3',
            question: 'Are all staff properly trained?',
            guidance: 'Review training records',
            responseType: 'YES_NO',
            isMandatory: true,
            requiresEvidence: true,
            orderIndex: 1
          },
          {
            itemId: 'item-4',
            question: 'Are policies up to date?',
            responseType: 'YES_NO_NA',
            isMandatory: true,
            requiresEvidence: false,
            orderIndex: 2
          }
        ]
      }
    ]
  };

  const sections = mockTemplate.checklistSections;
  const currentSectionData = sections[currentSection];

  const handleResponseChange = (
    sectionId: string,
    itemId: string,
    response: string,
    notes?: string
  ) => {
    const key = `${sectionId}-${itemId}`;
    setResponses((prev) => ({
      ...prev,
      [key]: {
        sectionId,
        itemId,
        response,
        notes
      }
    }));
  };

  const getResponseValue = (sectionId: string, itemId: string): string => {
    const key = `${sectionId}-${itemId}`;
    return responses[key]?.response || '';
  };

  const getNotesValue = (sectionId: string, itemId: string): string => {
    const key = `${sectionId}-${itemId}`;
    return responses[key]?.notes || '';
  };

  const calculateProgress = (): number => {
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
    const answeredItems = Object.keys(responses).length;
    return Math.round((answeredItems / totalItems) * 100);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    // TODO: Save responses to backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleCompleteAudit = async () => {
    if (!executiveSummary || !recommendations) {
      alert('Please provide executive summary and recommendations');
      return;
    }

    setIsSaving(true);
    // TODO: Complete audit via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    navigate(`/audits/${id}`);
  };

  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderResponseInput = (
    section: AuditChecklistSection,
    item: AuditChecklistItem
  ) => {
    const value = getResponseValue(section.sectionId, item.itemId);
    const notes = getNotesValue(section.sectionId, item.itemId);

    switch (item.responseType) {
      case 'YES_NO':
        return (
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  handleResponseChange(section.sectionId, item.itemId, 'YES', notes)
                }
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  value === 'YES'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                <span className="block text-sm font-medium">Yes</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleResponseChange(section.sectionId, item.itemId, 'NO', notes)
                }
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  value === 'NO'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <XCircle className="h-5 w-5 mx-auto mb-1" />
                <span className="block text-sm font-medium">No</span>
              </button>
            </div>
            <TextArea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) =>
                handleResponseChange(section.sectionId, item.itemId, value, e.target.value)
              }
              rows={2}
            />
          </div>
        );

      case 'YES_NO_NA':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  handleResponseChange(section.sectionId, item.itemId, 'YES', notes)
                }
                className={`py-3 px-4 rounded-lg border-2 transition-all ${
                  value === 'YES'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                <span className="block text-sm font-medium">Yes</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleResponseChange(section.sectionId, item.itemId, 'NO', notes)
                }
                className={`py-3 px-4 rounded-lg border-2 transition-all ${
                  value === 'NO'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <XCircle className="h-5 w-5 mx-auto mb-1" />
                <span className="block text-sm font-medium">No</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleResponseChange(section.sectionId, item.itemId, 'NA', notes)
                }
                className={`py-3 px-4 rounded-lg border-2 transition-all ${
                  value === 'NA'
                    ? 'border-gray-500 bg-gray-50 text-gray-900'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="block text-sm font-medium">N/A</span>
              </button>
            </div>
            <TextArea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) =>
                handleResponseChange(section.sectionId, item.itemId, value, e.target.value)
              }
              rows={2}
            />
          </div>
        );

      case 'COMPLIANT_NONCOMPLIANT':
        return (
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  handleResponseChange(section.sectionId, item.itemId, 'COMPLIANT', notes)
                }
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  value === 'COMPLIANT'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <span className="block text-sm font-medium">Compliant</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleResponseChange(section.sectionId, item.itemId, 'NON_COMPLIANT', notes)
                }
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  value === 'NON_COMPLIANT'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <span className="block text-sm font-medium">Non-Compliant</span>
              </button>
            </div>
            <TextArea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) =>
                handleResponseChange(section.sectionId, item.itemId, value, e.target.value)
              }
              rows={2}
            />
          </div>
        );

      case 'RATING':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() =>
                    handleResponseChange(
                      section.sectionId,
                      item.itemId,
                      rating.toString(),
                      notes
                    )
                  }
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    value === rating.toString()
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <span className="block text-lg font-bold">{rating}</span>
                </button>
              ))}
            </div>
            <TextArea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) =>
                handleResponseChange(section.sectionId, item.itemId, value, e.target.value)
              }
              rows={2}
            />
          </div>
        );

      case 'TEXT':
        return (
          <TextArea
            placeholder="Enter your response"
            value={value}
            onChange={(e) =>
              handleResponseChange(section.sectionId, item.itemId, e.target.value)
            }
            rows={4}
          />
        );

      default:
        return null;
    }
  };

  const progress = calculateProgress();
  const isLastSection = currentSection === sections.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/audits/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Execute Audit</h1>
          <p className="text-sm text-gray-600 mt-1">{audit.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section, index) => {
          const sectionItems = section.items.length;
          const answeredInSection = section.items.filter((item) =>
            getResponseValue(section.sectionId, item.itemId)
          ).length;
          const isComplete = answeredInSection === sectionItems;

          return (
            <button
              key={section.sectionId}
              type="button"
              onClick={() => setCurrentSection(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                currentSection === index
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{section.title}</span>
                {isComplete && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <span className="text-xs text-gray-600">
                {answeredInSection}/{sectionItems}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Section */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{currentSectionData.title}</h2>
            {currentSectionData.description && (
              <p className="text-sm text-gray-600 mt-1">{currentSectionData.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {currentSectionData.items.map((item, itemIndex) => (
              <div key={item.itemId} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="mb-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary">{itemIndex + 1}</Badge>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.question}</p>
                      {item.guidance && (
                        <p className="text-sm text-gray-600 mt-1">{item.guidance}</p>
                      )}
                      {item.standardReference && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reference: {item.standardReference}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {item.isMandatory && (
                          <Badge variant="warning">Required</Badge>
                        )}
                        {item.requiresEvidence && (
                          <Badge variant="info">Evidence Required</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {renderResponseInput(currentSectionData, item)}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousSection}
          disabled={currentSection === 0}
        >
          Previous Section
        </Button>
        {!isLastSection ? (
          <Button onClick={handleNextSection}>Next Section</Button>
        ) : (
          <Button variant="primary" onClick={() => setCurrentSection(-1)}>
            Complete Checklist
          </Button>
        )}
      </div>

      {/* Completion Form (shown after checklist) */}
      {currentSection === -1 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="h-6 w-6" />
              Complete Audit
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Executive Summary *
                </label>
                <TextArea
                  placeholder="Provide a summary of the audit findings and overall assessment"
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations *
                </label>
                <TextArea
                  placeholder="Provide recommendations for improvement"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentSection(sections.length - 1)}
                >
                  Back to Checklist
                </Button>
                <Button onClick={handleCompleteAudit} disabled={isSaving}>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Complete Audit
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Findings Summary */}
      {audit.findings && audit.findings.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Findings ({audit.findings.length})
            </h3>
            <div className="space-y-2">
              {audit.findings.slice(0, 3).map((finding) => (
                <div
                  key={finding.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-900">{finding.title}</span>
                  <Badge
                    variant={
                      finding.severity === 'CRITICAL'
                        ? 'error'
                        : finding.severity === 'MAJOR'
                        ? 'warning'
                        : 'secondary'
                    }
                  >
                    {finding.severity}
                  </Badge>
                </div>
              ))}
              {audit.findings.length > 3 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  +{audit.findings.length - 3} more findings
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
