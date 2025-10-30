"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBadge = exports.Badge = void 0;
const react_1 = __importDefault(require("react"));
const classnames_1 = require("../utils/classnames");
const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
};
const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};
const Badge = ({ children, variant = 'default', size = 'sm', className, }) => {
    return (<span className={(0, classnames_1.cn)('inline-flex items-center rounded-full font-medium', variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>);
};
exports.Badge = Badge;
const StatusBadge = ({ status }) => {
    const statusMap = {
        ACTIVE: { variant: 'success', label: 'Active' },
        INACTIVE: { variant: 'default', label: 'Inactive' },
        PENDING: { variant: 'warning', label: 'Pending' },
        COMPLETED: { variant: 'success', label: 'Completed' },
        CANCELLED: { variant: 'error', label: 'Cancelled' },
        SCHEDULED: { variant: 'info', label: 'Scheduled' },
    };
    const config = statusMap[status] || { variant: 'default', label: status };
    return <exports.Badge variant={config.variant}>{config.label}</exports.Badge>;
};
exports.StatusBadge = StatusBadge;
//# sourceMappingURL=Badge.js.map