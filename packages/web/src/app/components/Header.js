"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const hooks_1 = require("@/core/hooks");
const components_1 = require("@/core/components");
const Header = ({ onMenuClick }) => {
    const { user } = (0, hooks_1.useAuth)();
    return (<header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <components_1.Button variant="ghost" size="sm" onClick={onMenuClick} className="lg:hidden">
            <lucide_react_1.Menu className="h-6 w-6"/>
          </components_1.Button>
          <h1 className="text-xl font-bold text-primary-600">Care Commons</h1>
        </div>

        <div className="flex items-center gap-4">
          <components_1.Button variant="ghost" size="sm">
            <lucide_react_1.Bell className="h-5 w-5"/>
          </components_1.Button>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.roles[0]}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
              <lucide_react_1.User className="h-5 w-5"/>
            </div>
          </div>
        </div>
      </div>
    </header>);
};
exports.Header = Header;
//# sourceMappingURL=Header.js.map