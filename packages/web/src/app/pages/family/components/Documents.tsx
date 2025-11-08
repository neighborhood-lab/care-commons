import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface Document {
  id: string;
  name: string;
  type: string;
  uploaded_at: string;
  url: string;
  size?: number;
}

export const Documents: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['family', 'documents', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/documents`),
  });

  if (isLoading) {
    return <div className="text-gray-500">Loading documents...</div>;
  }

  if (!documents || documents.length === 0) {
    return <div className="text-gray-500">No documents available</div>;
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Documents</h3>
      <div className="space-y-2">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{doc.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {doc.type} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  {doc.size && ` • ${formatFileSize(doc.size)}`}
                </p>
              </div>
              <span className="text-blue-600 text-sm">Download →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
