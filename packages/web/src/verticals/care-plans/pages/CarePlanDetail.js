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
exports.CarePlanDetail = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const hooks_1 = require("@/core/hooks");
const utils_1 = require("@/core/utils");
const hooks_2 = require("../hooks");
const CarePlanDetail = () => {
    const { id } = (0, react_router_dom_1.useParams)();
    const { can } = (0, hooks_1.usePermissions)();
    const { data: carePlan, isLoading, error, refetch } = (0, hooks_2.useCarePlan)(id);
    const activateCarePlan = (0, hooks_2.useActivateCarePlan)();
    const [now] = (0, react_1.useState)(() => Date.now());
    const handleActivate = async () => {
        if (!carePlan)
            return;
        try {
            await activateCarePlan.mutateAsync(carePlan.id);
            refetch();
        }
        catch (error) {
        }
    };
    if (isLoading) {
        return (<div className="flex justify-center items-center py-12">
        <components_1.LoadingSpinner size="lg"/>
      </div>);
    }
    if (error || !carePlan) {
        return (<components_1.ErrorMessage message={error?.message || 'Failed to load care plan'} retry={refetch}/>);
    }
    const isExpiringSoon = carePlan.expirationDate &&
        new Date(carePlan.expirationDate) <= new Date(now + 30 * 24 * 60 * 60 * 1000);
    const isOverdue = carePlan.reviewDate &&
        new Date(carePlan.reviewDate) < new Date(now);
    const achievedGoalsCount = carePlan.goals.filter(g => g.status === 'ACHIEVED').length;
    const inProgressGoalsCount = carePlan.goals.filter(g => ['IN_PROGRESS', 'ON_TRACK'].includes(g.status)).length;
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <react_router_dom_1.Link to="/care-plans">
          <components_1.Button variant="ghost" size="sm" leftIcon={<lucide_react_1.ArrowLeft className="h-4 w-4"/>}>
            Back
          </components_1.Button>
        </react_router_dom_1.Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{carePlan.name}</h1>
          <p className="text-gray-600 mt-1">{carePlan.planNumber}</p>
          <p className="text-sm text-gray-500 mt-1">
            {carePlan.planType.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex gap-2">
          <components_1.StatusBadge status={carePlan.status}/>
          {can('care_plans:write') && (<>
              {carePlan.status === 'DRAFT' && (<components_1.Button leftIcon={<lucide_react_1.Play className="h-4 w-4"/>} onClick={handleActivate} isLoading={activateCarePlan.isPending}>
                  Activate
                </components_1.Button>)}
              <react_router_dom_1.Link to={`/care-plans/${carePlan.id}/edit`}>
                <components_1.Button variant="outline" leftIcon={<lucide_react_1.Edit className="h-4 w-4"/>}>
                  Edit
                </components_1.Button>
              </react_router_dom_1.Link>
            </>)}
        </div>
      </div>

      
      {(isExpiringSoon || isOverdue) && (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isExpiringSoon && (<div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-md">
              <lucide_react_1.AlertTriangle className="h-5 w-5 text-orange-600"/>
              <div>
                <p className="text-sm font-medium text-orange-800">Expiring Soon</p>
                <p className="text-sm text-orange-600">
                  This care plan expires on {(0, utils_1.formatDate)(carePlan.expirationDate)}
                </p>
              </div>
            </div>)}
          {isOverdue && (<div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-md">
              <lucide_react_1.AlertTriangle className="h-5 w-5 text-red-600"/>
              <div>
                <p className="text-sm font-medium text-red-800">Review Overdue</p>
                <p className="text-sm text-red-600">
                  Review was due on {(0, utils_1.formatDate)(carePlan.reviewDate)}
                </p>
              </div>
            </div>)}
        </div>)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <components_1.Card>
            <components_1.CardHeader title="Plan Information"/>
            <components_1.CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Client ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{carePlan.clientId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{carePlan.organizationId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {(0, utils_1.formatDate)(carePlan.effectiveDate)}
                  </dd>
                </div>
                {carePlan.expirationDate && (<div>
                    <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {(0, utils_1.formatDate)(carePlan.expirationDate)}
                    </dd>
                  </div>)}
                {carePlan.reviewDate && (<div>
                    <dt className="text-sm font-medium text-gray-500">Review Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {(0, utils_1.formatDate)(carePlan.reviewDate)}
                    </dd>
                  </div>)}
                {carePlan.estimatedHoursPerWeek && (<div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Hours/Week</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {carePlan.estimatedHoursPerWeek}
                    </dd>
                  </div>)}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1">
                    <span className={`text-sm font-medium ${carePlan.priority === 'URGENT' ? 'text-red-600' :
            carePlan.priority === 'HIGH' ? 'text-orange-600' :
                carePlan.priority === 'MEDIUM' ? 'text-yellow-600' :
                    'text-gray-600'}`}>
                      {carePlan.priority}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Compliance Status</dt>
                  <dd className="mt-1">
                    <components_1.StatusBadge status={carePlan.complianceStatus}/>
                  </dd>
                </div>
              </dl>

              {carePlan.assessmentSummary && (<div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Assessment Summary</dt>
                  <dd className="mt-1 text-sm text-gray-900">{carePlan.assessmentSummary}</dd>
                </div>)}

              {carePlan.notes && (<div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{carePlan.notes}</dd>
                </div>)}
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.Card>
            <components_1.CardHeader title={`Goals (${carePlan.goals.length})`}/>
            <components_1.CardContent>
              <div className="space-y-4">
                {carePlan.goals.map((goal) => (<div key={goal.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{goal.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {goal.category.replace(/_/g, ' ')} • Priority: {goal.priority}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <components_1.StatusBadge status={goal.status}/>
                        {goal.progressPercentage !== undefined && (<div className="text-sm text-gray-600">
                            {goal.progressPercentage}% Complete
                          </div>)}
                      </div>
                    </div>
                    {goal.targetDate && (<div className="mt-2 text-sm text-gray-600">
                        Target: {(0, utils_1.formatDate)(goal.targetDate)}
                      </div>)}
                    {goal.achievedDate && (<div className="mt-2 text-sm text-green-600">
                        <lucide_react_1.CheckCircle className="h-4 w-4 inline mr-1"/>
                        Achieved on {(0, utils_1.formatDate)(goal.achievedDate)}
                      </div>)}
                  </div>))}
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.Card>
            <components_1.CardHeader title={`Interventions (${carePlan.interventions.length})`}/>
            <components_1.CardContent>
              <div className="space-y-4">
                {carePlan.interventions.map((intervention) => (<div key={intervention.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{intervention.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{intervention.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {intervention.category.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <components_1.StatusBadge status={intervention.status}/>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{intervention.instructions}</p>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Started: {(0, utils_1.formatDate)(intervention.startDate)}
                      {intervention.endDate && ` • Ends: ${(0, utils_1.formatDate)(intervention.endDate)}`}
                    </div>
                  </div>))}
              </div>
            </components_1.CardContent>
          </components_1.Card>
        </div>

        
        <div className="space-y-6">
          
          <components_1.Card>
            <components_1.CardHeader title="Quick Stats"/>
            <components_1.CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Goals</span>
                  <span className="text-sm font-medium">{carePlan.goals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Achieved</span>
                  <span className="text-sm font-medium text-green-600">{achievedGoalsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-sm font-medium text-blue-600">{inProgressGoalsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Interventions</span>
                  <span className="text-sm font-medium">{carePlan.interventions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Task Templates</span>
                  <span className="text-sm font-medium">{carePlan.taskTemplates.length}</span>
                </div>
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.Card>
            <components_1.CardHeader title="Quick Actions"/>
            <components_1.CardContent>
              <div className="space-y-2">
                <react_router_dom_1.Link to={`/tasks?carePlanId=${carePlan.id}`}>
                  <components_1.Button variant="outline" size="sm" className="w-full justify-start">
                    <lucide_react_1.Target className="h-4 w-4 mr-2"/>
                    View Tasks
                  </components_1.Button>
                </react_router_dom_1.Link>
                <react_router_dom_1.Link to={`/care-plans/${carePlan.id}/progress-notes`}>
                  <components_1.Button variant="outline" size="sm" className="w-full justify-start">
                    <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                    Progress Notes
                  </components_1.Button>
                </react_router_dom_1.Link>
                <components_1.Button variant="outline" size="sm" className="w-full justify-start">
                  <lucide_react_1.User className="h-4 w-4 mr-2"/>
                  Assign Caregiver
                </components_1.Button>
                <components_1.Button variant="outline" size="sm" className="w-full justify-start">
                  <lucide_react_1.Calendar className="h-4 w-4 mr-2"/>
                  Schedule Review
                </components_1.Button>
              </div>
            </components_1.CardContent>
          </components_1.Card>

          
          <components_1.Card>
            <components_1.CardHeader title="Timeline"/>
            <components_1.CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-blue-500"/>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Care Plan Created</p>
                    <p className="text-xs text-gray-600">
                      {(0, utils_1.formatDate)(carePlan.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-green-500"/>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Effective Date</p>
                    <p className="text-xs text-gray-600">
                      {(0, utils_1.formatDate)(carePlan.effectiveDate)}
                    </p>
                  </div>
                </div>
                {carePlan.lastReviewedDate && (<div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-yellow-500"/>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Reviewed</p>
                      <p className="text-xs text-gray-600">
                        {(0, utils_1.formatDate)(carePlan.lastReviewedDate)}
                      </p>
                    </div>
                  </div>)}
                {carePlan.lastComplianceCheck && (<div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-purple-500"/>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Compliance Check</p>
                      <p className="text-xs text-gray-600">
                        {(0, utils_1.formatDate)(carePlan.lastComplianceCheck)}
                      </p>
                    </div>
                  </div>)}
              </div>
            </components_1.CardContent>
          </components_1.Card>
        </div>
      </div>
    </div>);
};
exports.CarePlanDetail = CarePlanDetail;
//# sourceMappingURL=CarePlanDetail.js.map