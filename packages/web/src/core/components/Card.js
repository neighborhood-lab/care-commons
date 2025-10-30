"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardFooter = exports.CardContent = exports.CardHeader = exports.Card = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = require("../utils/classnames");
const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};
const Card = ({ children, className, padding = 'md', hover = false, }) => {
    return (<div className={(0, classnames_1.cn)('bg-white rounded-lg shadow-sm border border-gray-200', paddingClasses[padding], hover && 'transition-shadow hover:shadow-md', className)}>
      {children}
    </div>);
};
exports.Card = Card;
const CardHeader = ({ title, subtitle, action, className, }) => {
    return (<div className={(0, classnames_1.cn)('flex items-start justify-between', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>);
};
exports.CardHeader = CardHeader;
const CardContent = ({ children, className }) => {
    return <div className={(0, classnames_1.cn)('mt-4', className)}>{children}</div>;
};
exports.CardContent = CardContent;
const CardFooter = ({ children, className }) => {
    return (<div className={(0, classnames_1.cn)('mt-6 pt-4 border-t border-gray-200', className)}>
      {children}
    </div>);
};
exports.CardFooter = CardFooter;
//# sourceMappingURL=Card.js.map