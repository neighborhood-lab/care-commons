"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientSearch = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'PENDING_INTAKE', label: 'Pending Intake' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'DISCHARGED', label: 'Discharged' },
];
const ClientSearch = ({ filters, onFiltersChange }) => {
    const [showAdvanced, setShowAdvanced] = react_1.default.useState(false);
    return (<div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <lucide_react_1.Search className="h-4 w-4 text-gray-400"/>
          </div>
          <components_1.Input placeholder="Search by name or client number..." value={filters.query || ''} onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })} className="pl-10"/>
        </div>
        <components_1.Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} leftIcon={<lucide_react_1.Filter className="h-4 w-4"/>}>
          Filters
        </components_1.Button>
      </div>

      {showAdvanced && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
          <components_1.Select label="Status" options={statusOptions} value={filters.status?.[0] || ''} onChange={(e) => onFiltersChange({
                ...filters,
                status: e.target.value ? [e.target.value] : undefined,
            })}/>
          <components_1.Input label="City" value={filters.city || ''} onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}/>
          <components_1.Input label="State" value={filters.state || ''} onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}/>
        </div>)}
    </div>);
};
exports.ClientSearch = ClientSearch;
//# sourceMappingURL=ClientSearch.js.map