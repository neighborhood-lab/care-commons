"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressNoteForm = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const noteTypeOptions = [
    { value: 'VISIT_NOTE', label: 'Visit Note' },
    { value: 'WEEKLY_SUMMARY', label: 'Weekly Summary' },
    { value: 'MONTHLY_SUMMARY', label: 'Monthly Summary' },
    { value: 'CARE_PLAN_REVIEW', label: 'Care Plan Review' },
    { value: 'INCIDENT', label: 'Incident Report' },
    { value: 'CHANGE_IN_CONDITION', label: 'Change in Condition' },
    { value: 'COMMUNICATION', label: 'Communication' },
    { value: 'OTHER', label: 'Other' },
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
const ProgressNoteForm = ({ carePlanId, clientId, isOpen, onClose, onSubmit, isLoading = false, authorInfo, }) => {
    const [selectedTags, setSelectedTags] = (0, react_1.useState)([]);
    const [newTag, setNewTag] = (0, react_1.useState)('');
    const [noteType, setNoteType] = (0, react_1.useState)('VISIT_NOTE');
    const [content, setContent] = (0, react_1.useState)('');
    const [isPrivate, setIsPrivate] = (0, react_1.useState)(false);
    const handleFormSubmit = () => {
        if (!content.trim())
            return;
        onSubmit({
            noteType,
            content,
            tags: selectedTags,
            isPrivate,
        });
    };
    const addTag = (tag) => {
        if (!selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag]);
        }
    };
    const removeTag = (tag) => {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    };
    const addCustomTag = () => {
        if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
            setSelectedTags([...selectedTags, newTag.trim()]);
            setNewTag('');
        }
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Progress Note</h2>
          <components_1.Button variant="ghost" size="sm" onClick={onClose} leftIcon={<lucide_react_1.X className="h-4 w-4"/>}/>
        </div>

        <div className="p-6 space-y-6">
          
          <components_1.Card>
            <components_1.CardHeader title="Author Information"/>
            <components_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <p className="mt-1 text-sm text-gray-900">{authorInfo.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Role</span>
                  <p className="mt-1 text-sm text-gray-900">{authorInfo.role}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date</span>
                  <p className="mt-1 text-sm text-gray-900">{(0, utils_1.formatDate)(new Date())}</p>
                </div>
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.FormField label="Note Type" required>
            <components_1.Select options={noteTypeOptions} value={noteType} onChange={(e) => setNoteType(e.target.value)}/>
          </components_1.FormField>

          
          <components_1.FormField label="Note Content" required>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter detailed progress note..." rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </components_1.FormField>

          
          <components_1.Card>
            <components_1.CardHeader title="Tags"/>
            <components_1.CardContent>
              <div className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Common Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (<button key={tag} type="button" onClick={() => addTag(tag)} className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag)
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
                        {tag}
                      </button>))}
                  </div>
                </div>

                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Tag</label>
                  <div className="flex gap-2">
                    <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyPress={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomTag();
            }
        }} placeholder="Enter custom tag..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    <components_1.Button type="button" variant="outline" onClick={addCustomTag} leftIcon={<lucide_react_1.Tag className="h-4 w-4"/>}>
                      Add
                    </components_1.Button>
                  </div>
                </div>

                
                {selectedTags.length > 0 && (<div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (<span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-300">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-blue-600 hover:text-blue-800">
                            <lucide_react_1.X className="h-3 w-3"/>
                          </button>
                        </span>))}
                    </div>
                  </div>)}
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.FormField label="Privacy Settings">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded border-gray-300"/>
                <span className="text-sm text-gray-700">
                  Mark as private note (only visible to authorized staff)
                </span>
              </label>
            </div>
          </components_1.FormField>

          
          <components_1.Card>
            <components_1.CardHeader title="Context"/>
            <components_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Care Plan ID:</span>
                  <p className="mt-1 text-gray-900">{carePlanId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Client ID:</span>
                  <p className="mt-1 text-gray-900">{clientId}</p>
                </div>
              </div>
            </components_1.CardContent>
          </components_1.Card>
        </div>

        
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <components_1.Button variant="outline" onClick={onClose}>
            Cancel
          </components_1.Button>
          <components_1.Button onClick={handleFormSubmit} disabled={isLoading || !content.trim()} leftIcon={isLoading ? <components_1.LoadingSpinner size="sm"/> : <lucide_react_1.FileText className="h-4 w-4"/>}>
            Save Note
          </components_1.Button>
        </div>
      </div>
    </div>);
};
exports.ProgressNoteForm = ProgressNoteForm;
//# sourceMappingURL=ProgressNoteForm.js.map