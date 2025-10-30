import { CarePlan } from '../types/care-plan';
import { StateJurisdiction, StateComplianceValidation, StateSpecificCarePlanData, TexasCarePlanRequirements, FloridaCarePlanRequirements } from '../types/state-specific';
export declare class StateComplianceValidator {
    static validateCarePlanCompliance(carePlan: CarePlan & Partial<StateSpecificCarePlanData>, stateJurisdiction: StateJurisdiction): StateComplianceValidation;
    private static validateTexasRequirements;
    private static validateFloridaRequirements;
    static validateActivation(carePlan: CarePlan & Partial<StateSpecificCarePlanData>, stateJurisdiction?: StateJurisdiction): StateComplianceValidation;
    static getTexasRequirements(): TexasCarePlanRequirements;
    static getFloridaRequirements(): FloridaCarePlanRequirements;
}
//# sourceMappingURL=state-compliance-validator.d.ts.map