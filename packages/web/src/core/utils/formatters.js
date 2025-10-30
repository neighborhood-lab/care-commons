"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalize = exports.truncate = exports.formatDuration = exports.formatCurrency = exports.formatPhone = exports.formatTime = exports.formatDateTime = exports.formatDate = void 0;
const formatDate = (date, options) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options || {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(d);
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    return (0, exports.formatDate)(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};
exports.formatDateTime = formatDateTime;
const formatTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(d);
};
exports.formatTime = formatTime;
const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
};
exports.formatPhone = formatPhone;
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0)
        return `${mins}m`;
    if (mins === 0)
        return `${hours}h`;
    return `${hours}h ${mins}m`;
};
exports.formatDuration = formatDuration;
const truncate = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
};
exports.truncate = truncate;
const capitalize = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
//# sourceMappingURL=formatters.js.map