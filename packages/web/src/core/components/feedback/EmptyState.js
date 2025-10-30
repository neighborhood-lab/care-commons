"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyState = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = require("../../utils/classnames");
const EmptyState = ({ title, description, icon, action, className, }) => {
    return (<div className={(0, classnames_1.cn)('flex flex-col items-center justify-center py-12 px-4', className)}>
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (<p className="text-sm text-gray-600 text-center mb-6 max-w-md">
          {description}
        </p>)}
      {action && <div>{action}</div>}
    </div>);
};
exports.EmptyState = EmptyState;
//# sourceMappingURL=EmptyState.js.map