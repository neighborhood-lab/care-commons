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
exports.CarePlanStats = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const CarePlanStats = ({ carePlan }) => {
    const [now] = (0, react_1.useState)(() => Date.now());
    const isExpiringSoon = carePlan.expirationDate &&
        new Date(carePlan.expirationDate) <= new Date(now + 30 * 24 * 60 * 60 * 1000);
    const isOverdue = carePlan.reviewDate &&
        new Date(carePlan.reviewDate) < new Date(now);
    const achievedGoalsCount = carePlan.goals.filter(goal => goal.status === 'ACHIEVED').length;
    const inProgressGoalsCount = carePlan.goals.filter(goal => goal.status === 'IN_PROGRESS').length;
    const atRiskGoalsCount = carePlan.goals.filter(goal => goal.status === 'AT_RISK').length;
    const notStartedGoalsCount = carePlan.goals.filter(goal => goal.status === 'NOT_STARTED').length;
    const averageGoalProgress = carePlan.goals.length > 0
        ? carePlan.goals.reduce((sum, goal) => sum + (goal.progressPercentage || 0), 0) / carePlan.goals.length
        : 0;
    const activeInterventionsCount = carePlan.interventions.filter(int => int.status === 'ACTIVE').length;
    const suspendedInterventionsCount = carePlan.interventions.filter(int => int.status === 'SUSPENDED').length;
    const getProgressColor = (progress) => {
        if (progress >= 80)
            return 'text-green-600';
        if (progress >= 60)
            return 'text-blue-600';
        if (progress >= 40)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const getComplianceColor = (status) => {
        switch (status) {
            case 'COMPLIANT':
                return 'text-green-600';
            case 'PENDING_REVIEW':
                return 'text-yellow-600';
            case 'EXPIRED':
            case 'NON_COMPLIANT':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };
    return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <components_1.Card>
        <components_1.CardHeader title="Goals"/>
        <components_1.CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold">{carePlan.goals.length}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Achieved</span>
                <span className="text-sm font-medium text-green-600">{achievedGoalsCount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">In Progress</span>
                <span className="text-sm font-medium text-blue-600">{inProgressGoalsCount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">At Risk</span>
                <span className="text-sm font-medium text-orange-600">{atRiskGoalsCount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Not Started</span>
                <span className="text-sm font-medium text-gray-600">{notStartedGoalsCount}</span>
              </div>
            </div>
          </div>
        </components_1.CardContent>
      </components_1.Card>

      
      <components_1.Card>
        <components_1.CardHeader title="Progress"/>
        <components_1.CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getProgressColor(averageGoalProgress)}`}>
                {Math.round(averageGoalProgress)}%
              </div>
              <p className="text-sm text-gray-600">Average Goal Progress</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium">
                  {carePlan.goals.length > 0
            ? Math.round((achievedGoalsCount / carePlan.goals.length) * 100)
            : 0}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">On Track</span>
                <span className="text-sm font-medium text-blue-600">
                  {inProgressGoalsCount} goals
                </span>
              </div>
            </div>
          </div>
        </components_1.CardContent>
      </components_1.Card>

      
      <components_1.Card>
        <components_1.CardHeader title="Interventions"/>
        <components_1.CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold">{carePlan.interventions.length}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Active</span>
                <span className="text-sm font-medium text-green-600">{activeInterventionsCount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-orange-600">Suspended</span>
                <span className="text-sm font-medium text-orange-600">{suspendedInterventionsCount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Task Templates</span>
                <span className="text-sm font-medium">{carePlan.taskTemplates.length}</span>
              </div>
            </div>
          </div>
        </components_1.CardContent>
      </components_1.Card>

      
      <components_1.Card>
        <components_1.CardHeader title="Status & Alerts"/>
        <components_1.CardContent>
          <div className="space-y-3">
            
            <div className="flex items-center gap-2">
              <lucide_react_1.CheckCircle className="h-4 w-4"/>
              <span className="text-sm text-gray-600">Compliance:</span>
              <span className={`text-sm font-medium ${getComplianceColor(carePlan.complianceStatus)}`}>
                {carePlan.complianceStatus.replace(/_/g, ' ')}
              </span>
            </div>

            
            <div className="flex items-center gap-2">
              <lucide_react_1.AlertTriangle className="h-4 w-4"/>
              <span className="text-sm text-gray-600">Priority:</span>
              <span className={`text-sm font-medium ${carePlan.priority === 'URGENT' ? 'text-red-600' :
            carePlan.priority === 'HIGH' ? 'text-orange-600' :
                carePlan.priority === 'MEDIUM' ? 'text-yellow-600' :
                    'text-gray-600'}`}>
                {carePlan.priority}
              </span>
            </div>

            
            {carePlan.estimatedHoursPerWeek && (<div className="flex items-center gap-2">
                <lucide_react_1.Clock className="h-4 w-4"/>
                <span className="text-sm text-gray-600">Hours/Week:</span>
                <span className="text-sm font-medium">{carePlan.estimatedHoursPerWeek}</span>
              </div>)}

            
            <div className="space-y-2 pt-2">
              {isExpiringSoon && (<div className="flex items-center gap-1 text-xs text-orange-600">
                  <lucide_react_1.AlertTriangle className="h-3 w-3"/>
                  Expires Soon
                </div>)}
              
              {isOverdue && (<div className="flex items-center gap-1 text-xs text-red-600">
                  <lucide_react_1.AlertTriangle className="h-3 w-3"/>
                  Review Overdue
                </div>)}
              
              {atRiskGoalsCount > 0 && (<div className="flex items-center gap-1 text-xs text-orange-600">
                  <lucide_react_1.AlertTriangle className="h-3 w-3"/>
                  {atRiskGoalsCount} Goals At Risk
                </div>)}
            </div>
          </div>
        </components_1.CardContent>
      </components_1.Card>
    </div>);
};
exports.CarePlanStats = CarePlanStats;
//# sourceMappingURL=CarePlanStats.js.map