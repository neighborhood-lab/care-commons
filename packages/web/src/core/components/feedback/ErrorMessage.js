"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessage = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const classnames_1 = require("../../utils/classnames");
const ErrorMessage = ({ title = 'Error', message, retry, className, }) => {
    return (<div className={(0, classnames_1.cn)('rounded-md bg-red-50 p-4 border border-red-200', className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <lucide_react_1.AlertCircle className="h-5 w-5 text-red-400"/>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">{message}</div>
          {retry && (<div className="mt-4">
              <button type="button" onClick={retry} className="text-sm font-medium text-red-800 hover:text-red-700 underline">
                Try again
              </button>
            </div>)}
        </div>
      </div>
    </div>);
};
exports.ErrorMessage = ErrorMessage;
//# sourceMappingURL=ErrorMessage.js.map