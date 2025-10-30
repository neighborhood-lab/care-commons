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
exports.ClientList = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const hooks_1 = require("@/core/hooks");
const hooks_2 = require("../hooks");
const components_2 = require("../components");
const ClientList = () => {
    const { can } = (0, hooks_1.usePermissions)();
    const [filters, setFilters] = (0, react_1.useState)({});
    const [viewMode, setViewMode] = (0, react_1.useState)('grid');
    const { data, isLoading, error, refetch } = (0, hooks_2.useClients)(filters);
    if (isLoading) {
        return (<div className="flex justify-center items-center py-12">
        <components_1.LoadingSpinner size="lg"/>
      </div>);
    }
    if (error) {
        return (<components_1.ErrorMessage message={error.message || 'Failed to load clients'} retry={refetch}/>);
    }
    const clients = data?.items || [];
    return (<div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            {data?.total || 0} total clients
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-md">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <lucide_react_1.Grid className="h-5 w-5"/>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
              <lucide_react_1.List className="h-5 w-5"/>
            </button>
          </div>
          {can('clients:write') && (<react_router_dom_1.Link to="/clients/new">
              <components_1.Button leftIcon={<lucide_react_1.Plus className="h-4 w-4"/>}>
                New Client
              </components_1.Button>
            </react_router_dom_1.Link>)}
        </div>
      </div>

      <components_2.ClientSearch filters={filters} onFiltersChange={setFilters}/>

      {clients.length === 0 ? (<components_1.EmptyState title="No clients found" description="Get started by creating your first client." action={can('clients:write') ? (<react_router_dom_1.Link to="/clients/new">
                <components_1.Button leftIcon={<lucide_react_1.Plus className="h-4 w-4"/>}>
                  Create Client
                </components_1.Button>
              </react_router_dom_1.Link>) : undefined}/>) : (<div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'}>
          {clients.map((client) => (<components_2.ClientCard key={client.id} client={client} compact={viewMode === 'list'}/>))}
        </div>)}

      {data && data.hasMore && (<div className="flex justify-center">
          <components_1.Button variant="outline">Load More</components_1.Button>
        </div>)}
    </div>);
};
exports.ClientList = ClientList;
//# sourceMappingURL=ClientList.js.map