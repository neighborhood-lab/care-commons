import React, { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, LoadingSpinner, EmptyState, ErrorMessage } from '@/core/components';
import { useCarePlanTemplates } from '../hooks';
import { TemplateCard, TemplatePreviewModal } from '../components';
import type { CarePlanTemplate } from '@care-commons/care-plans-tasks/browser';

export const CreateFromTemplatePage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<CarePlanTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data: templates, isLoading, error, refetch } = useCarePlanTemplates();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load templates'}
        retry={refetch}
      />
    );
  }

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'personal_care', label: 'Personal Care' },
    { value: 'skilled_nursing', label: 'Skilled Nursing' },
    { value: 'companionship', label: 'Companionship' },
    { value: 'memory_care', label: 'Memory Care' },
    { value: 'post_hospital', label: 'Post-Hospital' },
  ];

  const filteredTemplates =
    filterCategory === 'all'
      ? templates
      : templates?.filter((t) => t.category === filterCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/care-plans">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Care Plans
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Care Plan from Template
        </h1>
        <p className="text-gray-600">
          Choose a pre-built template to quickly create a care plan with common tasks
          and goals.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setFilterCategory(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filterCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {!filteredTemplates || filteredTemplates.length === 0 ? (
        <EmptyState
          title="No templates found"
          description="No care plan templates match your filter criteria."
          icon={<FileText className="h-12 w-12" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          isOpen={!!selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
};
