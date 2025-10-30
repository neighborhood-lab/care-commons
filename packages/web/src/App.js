"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_query_1 = require("@tanstack/react-query");
const react_hot_toast_1 = require("react-hot-toast");
const hooks_1 = require("./core/hooks");
const components_1 = require("./app/components");
const pages_1 = require("./app/pages");
const client_demographics_1 = require("./verticals/client-demographics");
const care_plans_1 = require("./verticals/care-plans");
const care_plans_2 = require("./verticals/care-plans");
const queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
        },
    },
});
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = (0, hooks_1.useAuth)();
    if (!isAuthenticated) {
        return <react_router_dom_1.Navigate to="/login" replace/>;
    }
    return <>{children}</>;
};
const PublicRoute = ({ children }) => {
    const { isAuthenticated } = (0, hooks_1.useAuth)();
    if (isAuthenticated) {
        return <react_router_dom_1.Navigate to="/" replace/>;
    }
    return <>{children}</>;
};
function AppRoutes() {
    return (<react_router_dom_1.Routes>
      <react_router_dom_1.Route path="/login" element={<PublicRoute>
            <pages_1.Login />
          </PublicRoute>}/>
      <react_router_dom_1.Route path="/" element={<ProtectedRoute>
            <components_1.AppShell>
              <pages_1.Dashboard />
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/clients" element={<ProtectedRoute>
            <components_1.AppShell>
              <client_demographics_1.ClientList />
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/clients/:id" element={<ProtectedRoute>
            <components_1.AppShell>
              <client_demographics_1.ClientDetail />
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/caregivers/*" element={<ProtectedRoute>
            <components_1.AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Caregivers Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/scheduling/*" element={<ProtectedRoute>
            <components_1.AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Scheduling Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/care-plans" element={<ProtectedRoute>
            <components_1.AppShell>
              <care_plans_1.CarePlanList />
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/care-plans/new" element={<ProtectedRoute>
            <components_1.AppShell>
              <care_plans_2.CreateCarePlanPage />
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/care-plans/:id" element={<ProtectedRoute>
            <components_1.AppShell>
              <care_plans_1.CarePlanDetail />
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/tasks" element={<ProtectedRoute>
            <components_1.AppShell>
              <care_plans_1.TaskList />
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/time-tracking/*" element={<ProtectedRoute>
            <components_1.AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Time Tracking Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/billing/*" element={<ProtectedRoute>
            <components_1.AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Billing Module</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="/settings/*" element={<ProtectedRoute>
            <components_1.AppShell>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                <p className="text-gray-600 mt-2">Coming soon...</p>
              </div>
            </components_1.AppShell>
          </ProtectedRoute>}/>
      <react_router_dom_1.Route path="*" element={<pages_1.NotFound />}/>
    </react_router_dom_1.Routes>);
}
function App() {
    return (<react_query_1.QueryClientProvider client={queryClient}>
      <react_router_dom_1.BrowserRouter>
        <AppRoutes />
        <react_hot_toast_1.Toaster position="top-right"/>
      </react_router_dom_1.BrowserRouter>
    </react_query_1.QueryClientProvider>);
}
exports.default = App;
//# sourceMappingURL=App.js.map