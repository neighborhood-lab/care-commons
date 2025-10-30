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
exports.CarePlanForm = void 0;
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const zod_2 = require("zod");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const carePlanSchema = zod_2.z.object({
    clientId: zod_2.z.string().min(1, 'Client ID is required'),
    organizationId: zod_2.z.string().min(1, 'Organization ID is required'),
    branchId: zod_2.z.string().optional(),
    name: zod_2.z.string().min(1, 'Care plan name is required'),
    planType: zod_2.z.enum(['PERSONAL_CARE', 'COMPANION', 'SKILLED_NURSING', 'THERAPY', 'HOSPICE', 'RESPITE', 'LIVE_IN', 'CUSTOM']),
    effectiveDate: zod_2.z.string().min(1, 'Effective date is required'),
    expirationDate: zod_2.z.string().optional(),
    coordinatorId: zod_2.z.string().optional(),
    notes: zod_2.z.string().optional(),
});
const planTypeOptions = [
    { value: 'PERSONAL_CARE', label: 'Personal Care' },
    { value: 'COMPANION', label: 'Companion' },
    { value: 'SKILLED_NURSING', label: 'Skilled Nursing' },
    { value: 'THERAPY', label: 'Therapy' },
    { value: 'HOSPICE', label: 'Hospice' },
    { value: 'RESPITE', label: 'Respite' },
    { value: 'LIVE_IN', label: 'Live In' },
    { value: 'CUSTOM', label: 'Custom' },
];
const CarePlanForm = ({ initialData, onSubmit, isLoading = false }) => {
    const [currentStep, setCurrentStep] = (0, react_1.useState)(0);
    const { register, handleSubmit, watch, setValue, formState: { errors }, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(carePlanSchema),
        defaultValues: {
            clientId: initialData?.clientId || '',
            organizationId: initialData?.organizationId || '',
            branchId: initialData?.branchId || '',
            name: initialData?.name || '',
            planType: initialData?.planType || 'PERSONAL_CARE',
            effectiveDate: initialData?.effectiveDate || (0, utils_1.formatDate)(new Date()),
            expirationDate: initialData?.expirationDate || '',
            coordinatorId: initialData?.coordinatorId || '',
            notes: initialData?.notes || '',
        },
    });
    const steps = [
        { title: 'Basic Information', description: 'Care plan details' },
        { title: 'Goals', description: 'Define care goals' },
        { title: 'Interventions', description: 'Plan interventions' },
        { title: 'Review', description: 'Review and submit' },
    ];
    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };
    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    const onFormSubmit = (data) => {
        onSubmit({
            ...data,
            goals: [],
            interventions: [],
        });
    };
    const renderBasicInfo = () => (<div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <components_1.FormField label="Client ID" error={errors.clientId?.message} required>
          <components_1.Input {...register('clientId')} placeholder="Enter client ID"/>
        </components_1.FormField>

        <components_1.FormField label="Organization ID" error={errors.organizationId?.message} required>
          <components_1.Input {...register('organizationId')} placeholder="Enter organization ID"/>
        </components_1.FormField>

        <components_1.FormField label="Branch ID (Optional)" error={errors.branchId?.message}>
          <components_1.Input {...register('branchId')} placeholder="Enter branch ID"/>
        </components_1.FormField>

        <components_1.FormField label="Coordinator ID (Optional)" error={errors.coordinatorId?.message}>
          <components_1.Input {...register('coordinatorId')} placeholder="Enter coordinator ID"/>
        </components_1.FormField>
      </div>

      <components_1.FormField label="Care Plan Name" error={errors.name?.message} required>
        <components_1.Input {...register('name')} placeholder="Enter care plan name"/>
      </components_1.FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <components_1.FormField label="Plan Type" error={errors.planType?.message} required>
          <components_1.Select options={planTypeOptions} value={watch('planType')} onChange={(e) => setValue('planType', e.target.value)}/>
        </components_1.FormField>

        <components_1.FormField label="Effective Date" error={errors.effectiveDate?.message} required>
          <components_1.Input {...register('effectiveDate')} type="date"/>
        </components_1.FormField>
      </div>

      <components_1.FormField label="Expiration Date (Optional)" error={errors.expirationDate?.message}>
        <components_1.Input {...register('expirationDate')} type="date"/>
      </components_1.FormField>

      <components_1.FormField label="Notes (Optional)" error={errors.notes?.message}>
        <textarea {...register('notes')} placeholder="Enter any additional notes" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
      </components_1.FormField>
    </div>);
    const renderGoals = () => (<div className="space-y-6">
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">Goals will be implemented in a future update</p>
        <p className="text-sm text-gray-400 mt-2">This will include goal creation, categories, priorities, and progress tracking</p>
      </div>
    </div>);
    const renderInterventions = () => (<div className="space-y-6">
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">Interventions will be implemented in a future update</p>
        <p className="text-sm text-gray-400 mt-2">This will include intervention planning, scheduling, and instructions</p>
      </div>
    </div>);
    const renderReview = () => {
        const watchedValues = watch();
        return (<div className="space-y-6">
        <h3 className="text-lg font-medium">Review Care Plan</h3>
        
        <components_1.Card>
          <components_1.CardHeader title="Basic Information"/>
          <components_1.CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.planType?.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Client ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.clientId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.organizationId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.effectiveDate}</dd>
              </div>
              {watchedValues.expirationDate && (<div>
                  <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{watchedValues.expirationDate}</dd>
                </div>)}
            </dl>
          </components_1.CardContent>
        </components_1.Card>

        <components_1.Card>
          <components_1.CardHeader title="Next Steps"/>
          <components_1.CardContent>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">Goals and Interventions</h4>
                <p className="text-sm text-gray-600">After creating the care plan, you can add specific goals and interventions</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">Task Templates</h4>
                <p className="text-sm text-gray-600">Create task templates for recurring care activities</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">Assign Caregivers</h4>
                <p className="text-sm text-gray-600">Assign primary caregivers and backup staff</p>
              </div>
            </div>
          </components_1.CardContent>
        </components_1.Card>
      </div>);
    };
    return (<div className="space-y-6">
      
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (<div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${index <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'}`}>
              {index + 1}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (<div className={`flex-1 h-px mx-4 ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}/>)}
          </div>))}
      </div>

      
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {currentStep === 0 && renderBasicInfo()}
        {currentStep === 1 && renderGoals()}
        {currentStep === 2 && renderInterventions()}
        {currentStep === 3 && renderReview()}

        
        <div className="flex justify-between mt-8">
          <components_1.Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
            Previous
          </components_1.Button>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (<components_1.Button type="button" onClick={nextStep}>
                Next
              </components_1.Button>) : (<components_1.Button type="submit" disabled={isLoading}>
                {isLoading ? <components_1.LoadingSpinner size="sm" className="mr-2"/> : null}
                Create Care Plan
              </components_1.Button>)}
          </div>
        </div>
      </form>
    </div>);
};
exports.CarePlanForm = CarePlanForm;
//# sourceMappingURL=CarePlanForm.js.map