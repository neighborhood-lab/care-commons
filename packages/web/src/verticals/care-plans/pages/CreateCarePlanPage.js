"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCarePlanPage = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const hooks_1 = require("../hooks");
const components_2 = require("../components");
const CreateCarePlanPage = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const createCarePlan = (0, hooks_1.useCreateCarePlan)();
    const handleSubmit = async (data) => {
        try {
            await createCarePlan.mutateAsync(data);
            navigate('/care-plans');
        }
        catch (error) {
        }
    };
    if (createCarePlan.isError) {
        return (<components_1.ErrorMessage message={createCarePlan.error?.message || 'Failed to create care plan'} retry={() => createCarePlan.reset()}/>);
    }
    return (<div className="space-y-6">
      
      <div className="flex items-center gap-4">
        <react_router_dom_1.Link to="/care-plans">
          <components_1.Button variant="ghost" size="sm" leftIcon={<lucide_react_1.ArrowLeft className="h-4 w-4"/>}>
            Back to Care Plans
          </components_1.Button>
        </react_router_dom_1.Link>
      </div>

      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Care Plan</h1>
        <p className="text-gray-600 mt-1">
          Create a new care plan with goals, interventions, and task templates
        </p>
      </div>

      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <components_2.CarePlanForm onSubmit={handleSubmit} isLoading={createCarePlan.isPending}/>
      </div>

      
      {createCarePlan.isPending && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <components_1.LoadingSpinner size="lg"/>
            <span className="text-lg font-medium">Creating Care Plan...</span>
          </div>
        </div>)}
    </div>);
};
exports.CreateCarePlanPage = CreateCarePlanPage;
//# sourceMappingURL=CreateCarePlanPage.js.map