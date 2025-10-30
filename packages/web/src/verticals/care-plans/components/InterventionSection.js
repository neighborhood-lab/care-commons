"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterventionSection = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const InterventionSection = ({ interventions, onInterventionClick }) => {
    if (interventions.length === 0) {
        return (<components_1.Card>
        <components_1.CardHeader title="Interventions"/>
        <components_1.CardContent>
          <div className="text-center py-8">
            <lucide_react_1.Activity className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
            <p className="text-gray-500">No interventions defined yet</p>
            <p className="text-sm text-gray-400 mt-1">Add interventions to outline care activities</p>
          </div>
        </components_1.CardContent>
      </components_1.Card>);
    }
    return (<components_1.Card>
      <components_1.CardHeader title={`Interventions (${interventions.length})`}/>
      <components_1.CardContent>
        <div className="space-y-4">
          {interventions.map((intervention) => (<div key={intervention.id} className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${onInterventionClick ? 'hover:border-blue-300' : ''}`} onClick={() => onInterventionClick?.(intervention)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">{intervention.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{intervention.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <lucide_react_1.Activity className="h-3 w-3"/>
                      {intervention.category.replace(/_/g, ' ')}
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <lucide_react_1.Calendar className="h-3 w-3"/>
                      Started: {(0, utils_1.formatDate)(intervention.startDate)}
                    </span>
                    
                    {intervention.endDate && (<span className="flex items-center gap-1">
                        <lucide_react_1.Clock className="h-3 w-3"/>
                        Ends: {(0, utils_1.formatDate)(intervention.endDate)}
                      </span>)}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <components_1.StatusBadge status={intervention.status}/>
                  
                  {intervention.status === 'SUSPENDED' && (<div className="flex items-center gap-1 text-xs text-orange-600">
                      <lucide_react_1.AlertCircle className="h-3 w-3"/>
                      Suspended
                    </div>)}
                </div>
              </div>

              
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-800 mb-1">Instructions:</p>
                <p className="text-sm text-blue-700">{intervention.instructions}</p>
              </div>

              
              {intervention.notes && (<div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{intervention.notes}</p>
                </div>)}

              
              {intervention.status === 'SUSPENDED' && (<div className="mt-3 p-3 bg-orange-50 rounded-md">
                  <p className="text-sm text-orange-700">
                    This intervention is currently suspended. Care activities should be paused until further notice.
                  </p>
                </div>)}

              {intervention.status === 'DISCONTINUED' && (<div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">
                    This intervention has been discontinued and is no longer part of the care plan.
                  </p>
                </div>)}

              
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <lucide_react_1.Calendar className="h-3 w-3"/>
                <span>
                  {intervention.endDate
                ? `Duration: ${(0, utils_1.formatDate)(intervention.startDate)} - ${(0, utils_1.formatDate)(intervention.endDate)}`
                : `Started: ${(0, utils_1.formatDate)(intervention.startDate)} (Ongoing)`}
                </span>
              </div>
            </div>))}
        </div>
      </components_1.CardContent>
    </components_1.Card>);
};
exports.InterventionSection = InterventionSection;
//# sourceMappingURL=InterventionSection.js.map