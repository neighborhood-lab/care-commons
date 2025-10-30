"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/core/utils");
const hooks_1 = require("@/core/hooks");
const components_1 = require("@/core/components");
const navItems = [
    { label: 'Dashboard', path: '/', icon: <lucide_react_1.Home className="h-5 w-5"/> },
    {
        label: 'Clients',
        path: '/clients',
        icon: <lucide_react_1.Users className="h-5 w-5"/>,
        permission: 'clients:read',
    },
    {
        label: 'Caregivers',
        path: '/caregivers',
        icon: <lucide_react_1.Users className="h-5 w-5"/>,
        permission: 'caregivers:read',
    },
    {
        label: 'Scheduling',
        path: '/scheduling',
        icon: <lucide_react_1.Calendar className="h-5 w-5"/>,
        permission: 'visits:read',
    },
    {
        label: 'Care Plans',
        path: '/care-plans',
        icon: <lucide_react_1.ClipboardList className="h-5 w-5"/>,
        permission: 'care_plans:read',
    },
    {
        label: 'Create Care Plan',
        path: '/care-plans/new',
        icon: <lucide_react_1.Plus className="h-5 w-5"/>,
        permission: 'care_plans:create',
    },
    {
        label: 'Tasks',
        path: '/tasks',
        icon: <lucide_react_1.CheckSquare className="h-5 w-5"/>,
        permission: 'tasks:read',
    },
    {
        label: 'Time Tracking',
        path: '/time-tracking',
        icon: <lucide_react_1.FileText className="h-5 w-5"/>,
        permission: 'evv:read',
    },
    {
        label: 'Billing',
        path: '/billing',
        icon: <lucide_react_1.DollarSign className="h-5 w-5"/>,
        permission: 'billing:read',
    },
];
const Sidebar = ({ isOpen, onClose }) => {
    const { logout } = (0, hooks_1.useAuth)();
    const { can } = (0, hooks_1.usePermissions)();
    const filteredNavItems = navItems.filter((item) => !item.permission || can(item.permission));
    return (<>
      
      {isOpen && (<div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden" onClick={onClose}/>)}

      
      <aside className={(0, utils_1.cn)('fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200', 'transform transition-transform duration-200 ease-in-out lg:translate-x-0', isOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex flex-col h-full">
          
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <components_1.Button variant="ghost" size="sm" onClick={onClose}>
              <lucide_react_1.X className="h-5 w-5"/>
            </components_1.Button>
          </div>

          
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (<react_router_dom_1.NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => (0, utils_1.cn)('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-700 hover:bg-gray-100')}>
                {item.icon}
                {item.label}
              </react_router_dom_1.NavLink>))}
          </nav>

          
          <div className="border-t border-gray-200 p-3 space-y-1">
            <react_router_dom_1.NavLink to="/settings" onClick={onClose} className={({ isActive }) => (0, utils_1.cn)('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-700 hover:bg-gray-100')}>
              <lucide_react_1.Settings className="h-5 w-5"/>
              Settings
            </react_router_dom_1.NavLink>
            <button onClick={() => {
            logout();
            onClose();
        }} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors">
              <lucide_react_1.LogOut className="h-5 w-5"/>
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>);
};
exports.Sidebar = Sidebar;
//# sourceMappingURL=Sidebar.js.map