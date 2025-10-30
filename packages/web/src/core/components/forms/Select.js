"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = require("../../utils/classnames");
exports.Select = react_1.default.forwardRef(({ error, label, helperText, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s/g, '-')}`;
    return (<div className="w-full">
        {label && (<label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>)}
        <select ref={ref} id={selectId} className={(0, classnames_1.cn)('block w-full rounded-md border-gray-300 shadow-sm', 'focus:border-primary-500 focus:ring-primary-500 sm:text-sm', 'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed', error && 'border-red-300 focus:border-red-500 focus:ring-red-500', className)} aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? `${selectId}-error` : undefined} {...props}>
          {placeholder && (<option value="" disabled>
              {placeholder}
            </option>)}
          {options.map((option) => (<option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>))}
        </select>
        {error && (<p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
            {error}
          </p>)}
        {helperText && !error && (<p className="mt-1 text-sm text-gray-500">{helperText}</p>)}
      </div>);
});
exports.Select.displayName = 'Select';
//# sourceMappingURL=Select.js.map