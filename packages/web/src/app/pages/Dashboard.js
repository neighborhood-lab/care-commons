"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = void 0;
const react_1 = __importDefault(require("react"));
const hooks_1 = require("@/core/hooks");
const components_1 = require("@/core/components");
const lucide_react_1 = require("lucide-react");
const Dashboard = () => {
    const { user } = (0, hooks_1.useAuth)();
    const stats = [
        {
            label: 'Active Clients',
            value: '124',
            icon: <lucide_react_1.Users className="h-6 w-6 text-primary-600"/>,
            change: '+12%',
        },
        {
            label: "Today's Visits",
            value: '18',
            icon: <lucide_react_1.Calendar className="h-6 w-6 text-green-600"/>,
            change: '+5%',
        },
        {
            label: 'Pending Tasks',
            value: '7',
            icon: <lucide_react_1.ClipboardList className="h-6 w-6 text-yellow-600"/>,
            change: '-3%',
        },
        {
            label: 'Alerts',
            value: '3',
            icon: <lucide_react_1.AlertCircle className="h-6 w-6 text-red-600"/>,
            change: '+2',
        },
    ];
    return (<div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-gray-600">
          Here's what's happening with your care operations today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (<components_1.Card key={stat.label} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-600">{stat.change} from last week</p>
              </div>
              <div className="flex-shrink-0">{stat.icon}</div>
            </div>
          </components_1.Card>))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <components_1.Card>
          <components_1.CardHeader title="Recent Activity"/>
          <components_1.CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-green-500"/>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Visit completed for John Doe
                  </p>
                  <p className="text-xs text-gray-600">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500"/>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New client intake scheduled
                  </p>
                  <p className="text-xs text-gray-600">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-yellow-500"/>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Care plan update required
                  </p>
                  <p className="text-xs text-gray-600">Yesterday</p>
                </div>
              </div>
            </div>
          </components_1.CardContent>
        </components_1.Card>

        <components_1.Card>
          <components_1.CardHeader title="Upcoming Visits"/>
          <components_1.CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                  <p className="text-xs text-gray-600">Personal Care - 2 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">10:00 AM</p>
                  <p className="text-xs text-gray-600">Jane Smith</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Michael Brown</p>
                  <p className="text-xs text-gray-600">Companion Care - 3 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">2:00 PM</p>
                  <p className="text-xs text-gray-600">Bob Williams</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">Emily Davis</p>
                  <p className="text-xs text-gray-600">Skilled Nursing - 1 hour</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">4:30 PM</p>
                  <p className="text-xs text-gray-600">Mary Johnson</p>
                </div>
              </div>
            </div>
          </components_1.CardContent>
        </components_1.Card>
      </div>
    </div>);
};
exports.Dashboard = Dashboard;
//# sourceMappingURL=Dashboard.js.map