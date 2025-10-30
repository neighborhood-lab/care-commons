"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormField = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = require("../../utils/classnames");
const FormField = ({ label, error, required, helperText, children, className, }) => {
    return (<div className={(0, classnames_1.cn)('space-y-1', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>);
};
exports.FormField = FormField;
//# sourceMappingURL=FormField.js.map