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
exports.CarePlanCard = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const CarePlanCard = ({ carePlan, compact = false }) => {
    const [now] = (0, react_1.useState)(() => Date.now());
    const isExpiringSoon = carePlan.expirationDate &&
        new Date(carePlan.expirationDate) <= new Date(now + 30 * 24 * 60 * 60 * 1000);
    const isOverdue = carePlan.reviewDate &&
        new Date(carePlan.reviewDate) < new Date(now);
    return (<react_router_dom_1.Link to={`/care-plans/${carePlan.id}`}>
      <components_1.Card padding="md" hover className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {carePlan.name}
            </h3>
            <p className="text-sm text-gray-600">{carePlan.planNumber}</p>
            <p className="text-xs text-gray-500 mt-1">
              {carePlan.planType.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <components_1.StatusBadge status={carePlan.status}/>
            {isExpiringSoon && (<div className="flex items-center gap-1 text-xs text-orange-600">
                <lucide_react_1.AlertTriangle className="h-3 w-3"/>
                Expires Soon
              </div>)}
            {isOverdue && (<div className="flex items-center gap-1 text-xs text-red-600">
                <lucide_react_1.AlertTriangle className="h-3 w-3"/>
                Review Overdue
              </div>)}
          </div>
        </div>

        {!compact && (<div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <lucide_react_1.User className="h-4 w-4"/>
              Client ID: {carePlan.clientId}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <lucide_react_1.Target className="h-4 w-4"/>
              {carePlan.goals.length} Goals, {carePlan.interventions.length} Interventions
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <lucide_react_1.Calendar className="h-4 w-4"/>
              Effective: {(0, utils_1.formatDate)(carePlan.effectiveDate)}
            </div>

            {carePlan.expirationDate && (<div className="flex items-center gap-2 text-sm text-gray-600">
                <lucide_react_1.Clock className="h-4 w-4"/>
                Expires: {(0, utils_1.formatDate)(carePlan.expirationDate)}
              </div>)}

            {carePlan.estimatedHoursPerWeek && (<div className="flex items-center gap-2 text-sm text-gray-600">
                <lucide_react_1.Clock className="h-4 w-4"/>
                {carePlan.estimatedHoursPerWeek} hrs/week
              </div>)}

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Priority:</span>
              <span className={`text-xs font-medium ${carePlan.priority === 'URGENT' ? 'text-red-600' :
                carePlan.priority === 'HIGH' ? 'text-orange-600' :
                    carePlan.priority === 'MEDIUM' ? 'text-yellow-600' :
                        'text-gray-600'}`}>
                {carePlan.priority}
              </span>
            </div>
          </div>)}
      </components_1.Card>
    </react_router_dom_1.Link>);
};
exports.CarePlanCard = CarePlanCard;
//# sourceMappingURL=CarePlanCard.js.map