"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFound = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const NotFound = () => {
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">
          Page not found
        </h2>
        <p className="mt-2 text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <react_router_dom_1.Link to="/">
            <components_1.Button variant="primary" leftIcon={<lucide_react_1.Home className="h-4 w-4"/>}>
              Go back home
            </components_1.Button>
          </react_router_dom_1.Link>
        </div>
      </div>
    </div>);
};
exports.NotFound = NotFound;
//# sourceMappingURL=NotFound.js.map