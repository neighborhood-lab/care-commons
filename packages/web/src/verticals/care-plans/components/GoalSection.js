"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalSection = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const GoalSection = ({ goals, onGoalClick }) => {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT':
                return 'text-red-600';
            case 'HIGH':
                return 'text-orange-600';
            case 'MEDIUM':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };
    if (goals.length === 0) {
        return (<components_1.Card>
        <components_1.CardHeader title="Goals"/>
        <components_1.CardContent>
          <div className="text-center py-8">
            <lucide_react_1.Target className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
            <p className="text-gray-500">No goals defined yet</p>
            <p className="text-sm text-gray-400 mt-1">Add goals to track care progress</p>
          </div>
        </components_1.CardContent>
      </components_1.Card>);
    }
    return (<components_1.Card>
      <components_1.CardHeader title={`Goals (${goals.length})`}/>
      <components_1.CardContent>
        <div className="space-y-4">
          {goals.map((goal) => (<div key={goal.id} className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${onGoalClick ? 'hover:border-blue-300' : ''}`} onClick={() => onGoalClick?.(goal)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{goal.name}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <lucide_react_1.Target className="h-3 w-3"/>
                      {goal.category.replace(/_/g, ' ')}
                    </span>
                    
                    {goal.targetDate && (<span className="flex items-center gap-1">
                        <lucide_react_1.Calendar className="h-3 w-3"/>
                        Target: {(0, utils_1.formatDate)(goal.targetDate)}
                      </span>)}
                    
                    {goal.progressPercentage !== undefined && (<span className="flex items-center gap-1">
                        <lucide_react_1.TrendingUp className="h-3 w-3"/>
                        {goal.progressPercentage}% Complete
                      </span>)}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <components_1.StatusBadge status={goal.status}/>
                  
                  {goal.status === 'AT_RISK' && (<div className="flex items-center gap-1 text-xs text-orange-600">
                      <lucide_react_1.AlertCircle className="h-3 w-3"/>
                      At Risk
                    </div>)}
                </div>
              </div>

              
              {goal.progressPercentage !== undefined && (<div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${goal.status === 'ACHIEVED'
                    ? 'bg-green-500'
                    : goal.status === 'AT_RISK'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'}`} style={{ width: `${goal.progressPercentage}%` }}/>
                  </div>
                </div>)}

              
              {goal.achievedDate && (<div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                  <lucide_react_1.Target className="h-4 w-4"/>
                  Achieved on {(0, utils_1.formatDate)(goal.achievedDate)}
                </div>)}

              
              {goal.lastAssessedDate && (<div className="mt-2 text-xs text-gray-500">
                  Last assessed: {(0, utils_1.formatDate)(goal.lastAssessedDate)}
                </div>)}

              
              {goal.notes && (<div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{goal.notes}</p>
                </div>)}

              
              {goal.outcome && (<div className="mt-3 p-3 bg-green-50 rounded-md">
                  <p className="text-sm font-medium text-green-800 mb-1">Outcome:</p>
                  <p className="text-sm text-green-700">{goal.outcome}</p>
                </div>)}
            </div>))}
        </div>
      </components_1.CardContent>
    </components_1.Card>);
};
exports.GoalSection = GoalSection;
//# sourceMappingURL=GoalSection.js.map