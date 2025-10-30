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
exports.TaskCompletionModal = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const hooks_1 = require("../hooks");
const TaskCompletionModal = ({ task, isOpen, onClose, onComplete, }) => {
    const [completionNote, setCompletionNote] = (0, react_1.useState)('');
    const [signatureData, setSignatureData] = (0, react_1.useState)('');
    const [photoData, setPhotoData] = (0, react_1.useState)([]);
    const [observations, setObservations] = (0, react_1.useState)({});
    const [gpsLocation, setGpsLocation] = (0, react_1.useState)(null);
    const completeTask = (0, hooks_1.useCompleteTask)();
    const handleComplete = async () => {
        try {
            const input = {
                completionNote: completionNote || 'Task completed successfully',
                customFieldValues: {
                    signature: signatureData,
                    photos: photoData,
                    observations,
                    gpsLocation,
                },
            };
            await completeTask.mutateAsync({ id: task.id, input });
            onComplete?.();
            onClose();
        }
        catch (error) {
        }
    };
    const handlePhotoCapture = () => {
        const mockPhoto = `data:image/jpeg;base64,mock-photo-${Date.now()}`;
        setPhotoData([...photoData, mockPhoto]);
    };
    const handleSignatureCapture = () => {
        const mockSignature = `data:image/png;base64,mock-signature-${Date.now()}`;
        setSignatureData(mockSignature);
    };
    const requestGPSLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setGpsLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            }, (error) => {
                console.error('GPS location error:', error);
            });
        }
    };
    const handleObservationChange = (key, value) => {
        setObservations({ ...observations, [key]: value });
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Complete Task</h2>
          <components_1.Button variant="ghost" size="sm" onClick={onClose} leftIcon={<lucide_react_1.X className="h-4 w-4"/>}/>
        </div>

        <div className="p-6 space-y-6">
          
          <components_1.Card>
            <components_1.CardHeader title="Task Details"/>
            <components_1.CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">{task.name}</span>
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <lucide_react_1.Clock className="h-4 w-4"/>
                    {(0, utils_1.formatDate)(task.scheduledDate)} {task.scheduledTime && (0, utils_1.formatTime)(task.scheduledTime)}
                  </span>
                  <span>{task.category.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.FormField label="Completion Note" required>
            <textarea value={completionNote} onChange={(e) => setCompletionNote(e.target.value)} placeholder="Describe how the task was completed..." rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </components_1.FormField>

          
          {task.requiredSignature && (<components_1.Card>
              <components_1.CardHeader title="Signature Required"/>
              <components_1.CardContent>
                <div className="space-y-4">
                  {signatureData ? (<div className="border-2 border-gray-300 rounded-md p-4">
                      <img src={signatureData} alt="Signature" className="max-h-32 mx-auto"/>
                      <components_1.Button variant="outline" size="sm" onClick={() => setSignatureData('')} className="mt-2">
                        Clear Signature
                      </components_1.Button>
                    </div>) : (<div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                      <lucide_react_1.CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                      <p className="text-gray-600 mb-4">Client signature required</p>
                      <components_1.Button onClick={handleSignatureCapture}>
                        Capture Signature
                      </components_1.Button>
                    </div>)}
                </div>
              </components_1.CardContent>
            </components_1.Card>)}

          
          <components_1.Card>
            <components_1.CardHeader title="Photos (Optional)"/>
            <components_1.CardContent>
              <div className="space-y-4">
                {photoData.length > 0 && (<div className="grid grid-cols-3 gap-4">
                    {photoData.map((photo, index) => (<div key={index} className="relative">
                        <img src={photo} alt={`Task photo ${index + 1}`} className="w-full h-24 object-cover rounded-md border"/>
                        <components_1.Button variant="ghost" size="sm" onClick={() => setPhotoData(photoData.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                          <lucide_react_1.X className="h-3 w-3"/>
                        </components_1.Button>
                      </div>))}
                  </div>)}
                
                <components_1.Button variant="outline" onClick={handlePhotoCapture} leftIcon={<lucide_react_1.Camera className="h-4 w-4"/>}>
                  Add Photo
                </components_1.Button>
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.Card>
            <components_1.CardHeader title="Location Verification"/>
            <components_1.CardContent>
              <div className="space-y-4">
                {gpsLocation ? (<div className="flex items-center gap-2 text-sm text-green-600">
                    <lucide_react_1.MapPin className="h-4 w-4"/>
                    Location verified: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                  </div>) : (<components_1.Button variant="outline" onClick={requestGPSLocation} leftIcon={<lucide_react_1.MapPin className="h-4 w-4"/>}>
                    Verify Location
                  </components_1.Button>)}
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.Card>
            <components_1.CardHeader title="Observations"/>
            <components_1.CardContent>
              <div className="space-y-4">
                <components_1.FormField label="Client Condition">
                  <textarea value={observations.clientCondition || ''} onChange={(e) => handleObservationChange('clientCondition', e.target.value)} placeholder="Describe client's condition during task..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </components_1.FormField>

                <components_1.FormField label="Issues or Concerns">
                  <textarea value={observations.concerns || ''} onChange={(e) => handleObservationChange('concerns', e.target.value)} placeholder="Any issues or concerns noted..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </components_1.FormField>

                <components_1.FormField label="Additional Notes">
                  <textarea value={observations.additionalNotes || ''} onChange={(e) => handleObservationChange('additionalNotes', e.target.value)} placeholder="Any additional observations..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </components_1.FormField>
              </div>
            </components_1.CardContent>
          </components_1.Card>
        </div>

        
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <components_1.Button variant="outline" onClick={onClose}>
            Cancel
          </components_1.Button>
          <components_1.Button onClick={handleComplete} disabled={completeTask.isPending || (task.requiredSignature && !signatureData)} leftIcon={completeTask.isPending ? <components_1.LoadingSpinner size="sm"/> : <lucide_react_1.CheckCircle className="h-4 w-4"/>}>
            Complete Task
          </components_1.Button>
        </div>
      </div>
    </div>);
};
exports.TaskCompletionModal = TaskCompletionModal;
//# sourceMappingURL=TaskCompletionModal.js.map